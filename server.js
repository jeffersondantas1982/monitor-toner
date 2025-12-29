const express = require('express');
const cors = require('cors');
const snmp = require('net-snmp');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Load printer configuration
const printersConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'config', 'printers.json'), 'utf8')
);

// SNMP OIDs for printer information
const OIDS = {
  // Standard Printer MIB OIDs
  deviceDescription: '1.3.6.1.2.1.25.3.2.1.3.1',
  deviceStatus: '1.3.6.1.2.1.25.3.2.1.5.1',

  // HP Printer specific OIDs
  hp: {
    blackToner: '1.3.6.1.2.1.43.11.1.1.9.1.1',
    cyanToner: '1.3.6.1.2.1.43.11.1.1.9.1.2',
    magentaToner: '1.3.6.1.2.1.43.11.1.1.9.1.3',
    yellowToner: '1.3.6.1.2.1.43.11.1.1.9.1.4',
    blackTonerMax: '1.3.6.1.2.1.43.11.1.1.8.1.1',
    cyanTonerMax: '1.3.6.1.2.1.43.11.1.1.8.1.2',
    magentaTonerMax: '1.3.6.1.2.1.43.11.1.1.8.1.3',
    yellowTonerMax: '1.3.6.1.2.1.43.11.1.1.8.1.4',
  },

  // Generic toner level OIDs (works for most printers)
  generic: {
    markerSuppliesLevel: '1.3.6.1.2.1.43.11.1.1.9.1',
    markerSuppliesMaxCapacity: '1.3.6.1.2.1.43.11.1.1.8.1',
    markerSuppliesDescription: '1.3.6.1.2.1.43.11.1.1.6.1',
    markerSuppliesType: '1.3.6.1.2.1.43.11.1.1.4.1',
    // Standard Printer MIB - Page Count
    pageCount: '1.3.6.1.2.1.43.10.2.1.4.1.1',
    // Pantum specific OIDs
    pantumPageCount1: '1.3.6.1.4.1.40093.1.1.3.3',
    pantumPageCount2: '1.3.6.1.4.1.40093.10.3.1.1'
  }
};

// Cache for printer status
let printerStatusCache = {};

// Helper function to try Pantum OID with specific community string
function tryPantumOID(ip, community) {
  return new Promise((resolve, reject) => {
    const session = snmp.createSession(ip, community, {
      version: snmp.Version2c,
      timeout: 5000,
      retries: 2
    });

    // Pantum-specific OID for toner level percentage
    const pantumOid = '1.3.6.1.4.1.40093.6.3.1';

    session.get([pantumOid], (error, varbinds) => {
      session.close();

      if (error) {
        reject(error);
        return;
      }

      if (varbinds && varbinds.length > 0 && !snmp.isVarbindError(varbinds[0])) {
        const percentage = parseInt(varbinds[0].value);

        if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
          resolve([{
            index: 1,
            currentLevel: percentage,
            maxCapacity: 100,
            percentage: percentage
          }]);
          return;
        }
      }

      reject(new Error('Pantum OID returned invalid data'));
    });
  });
}

// Get toner levels for Pantum printers using specific OID
function getPantumTonerLevels(ip) {
  return new Promise(async (resolve, reject) => {
    // Try with v2cpublic first (Pantum default for SNMPv2c)
    try {
      const result = await tryPantumOID(ip, 'v2cpublic');
      if (result) {
        console.log(`✓ Pantum printer ${ip} responded with 'v2cpublic'`);
        resolve(result);
        return;
      }
    } catch (error) {
      console.log(`Pantum query with 'v2cpublic' failed for ${ip}, trying 'public'...`);
    }

    // Fallback to 'public' community string
    try {
      const result = await tryPantumOID(ip, 'public');
      if (result) {
        console.log(`✓ Pantum printer ${ip} responded with 'public'`);
        resolve(result);
        return;
      }
    } catch (error) {
      console.log(`Pantum query with 'public' also failed for ${ip}`);
    }

    reject(new Error('All Pantum OID attempts failed'));
  });
}

// Get printer toner levels using SNMP walk with manufacturer-specific support
function getPrinterTonerLevels(ip, manufacturer) {
  return new Promise(async (resolve, reject) => {
    // Try Pantum-specific OID first for Pantum printers
    if (manufacturer && manufacturer.toUpperCase() === 'PANTUM') {
      try {
        const pantumData = await getPantumTonerLevels(ip);
        if (pantumData && pantumData.length > 0) {
          resolve(pantumData);
          return;
        }
      } catch (error) {
        console.log(`Pantum-specific OID failed for ${ip}, trying generic method...`);
      }
    }

    // Fallback to generic method (works for HP and others)
    const session = snmp.createSession(ip, 'public', {
      version: snmp.Version2c,
      timeout: 5000,
      retries: 2
    });

    const supplies = [];
    const maxOid = OIDS.generic.markerSuppliesLevel;

    session.subtree(maxOid, (varbinds) => {
      varbinds.forEach((varbind) => {
        if (!snmp.isVarbindError(varbind)) {
          supplies.push({
            oid: varbind.oid,
            level: varbind.value
          });
        }
      });
    }, (error) => {
      session.close();

      if (error) {
        reject(error);
        return;
      }

      // Get max capacities
      const sessionMax = snmp.createSession(ip, 'public', {
        version: snmp.Version2c,
        timeout: 5000,
        retries: 2
      });

      const maxCapacities = [];
      const maxCapOid = OIDS.generic.markerSuppliesMaxCapacity;

      sessionMax.subtree(maxCapOid, (varbinds) => {
        varbinds.forEach((varbind) => {
          if (!snmp.isVarbindError(varbind)) {
            maxCapacities.push({
              oid: varbind.oid,
              maxLevel: varbind.value
            });
          }
        });
      }, (error) => {
        sessionMax.close();

        if (error) {
          reject(error);
          return;
        }

        // Combine supplies with max capacities
        const tonerData = supplies.map((supply, index) => {
          const maxCap = maxCapacities[index] ? maxCapacities[index].maxLevel : 100;
          const percentage = maxCap > 0 ? Math.round((supply.level / maxCap) * 100) : 0;

          return {
            index: index + 1,
            currentLevel: supply.level,
            maxCapacity: maxCap,
            percentage: Math.min(100, Math.max(0, percentage))
          };
        });

        resolve(tonerData);
      });
    });
  });
}

// Helper function to get single OID
function getSnmpValue(session, oid) {
  return new Promise((resolve, reject) => {
    session.get([oid], (error, varbinds) => {
      if (error) {
        resolve(null);
      } else {
        if (snmp.isVarbindError(varbinds[0])) {
          resolve(null);
        } else {
          resolve(varbinds[0].value);
        }
      }
    });
  });
}

// Get printer page count with fallback strategies
async function getPrinterPageCount(ip) {
  const communities = ['public', 'v2cpublic'];
  const oidsToTry = [
    OIDS.generic.pageCount,
    OIDS.generic.pantumPageCount1,
    OIDS.generic.pantumPageCount2
  ];

  for (const community of communities) {
    try {
      const session = snmp.createSession(ip, community, {
        version: snmp.Version2c,
        timeout: 2000,
        retries: 1
      });

      for (const oid of oidsToTry) {
        const value = await getSnmpValue(session, oid);
        if (value !== null && value !== undefined) {
          session.close();
          return value;
        }
      }
      session.close();
    } catch (e) {
      // Continue next community
    }
  }

  return 0;
}

// Get printer status
async function getPrinterStatus(printer) {
  try {
    const [tonerLevels, pageCount] = await Promise.all([
      getPrinterTonerLevels(printer.ip, printer.manufacturer),
      getPrinterPageCount(printer.ip)
    ]);


    // Determine toner colors based on manufacturer and available cartridges
    const toners = {};

    if (tonerLevels.length > 0) {
      // For color printers (usually 4 cartridges: Black, Cyan, Magenta, Yellow)
      // For mono printers (usually 1 cartridge: Black)

      if (tonerLevels.length >= 4) {
        toners.black = tonerLevels[0];
        toners.cyan = tonerLevels[1];
        toners.magenta = tonerLevels[2];
        toners.yellow = tonerLevels[3];
      } else if (tonerLevels.length === 1) {
        toners.black = tonerLevels[0];
      } else {
        // Handle other cases
        tonerLevels.forEach((toner, index) => {
          toners[`cartridge_${index + 1}`] = toner;
        });
      }
    }

    return {
      id: printer.id,
      name: printer.name,
      ip: printer.ip,
      model: printer.model,
      manufacturer: printer.manufacturer,
      location: printer.location,
      serial: printer.serial,
      pageCount: pageCount || 0,
      status: 'online',
      toners: toners,
      lastUpdate: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error querying printer ${printer.name} (${printer.ip}):`, error.message);

    return {
      id: printer.id,
      name: printer.name,
      ip: printer.ip,
      model: printer.model,
      manufacturer: printer.manufacturer,
      location: printer.location,
      serial: printer.serial,
      status: 'offline',
      error: error.message,
      toners: {},
      lastUpdate: new Date().toISOString()
    };
  }
}

// Update all printer statuses
async function updateAllPrinterStatuses() {
  console.log('Updating printer statuses...');

  const promises = printersConfig.printers.map(printer => getPrinterStatus(printer));
  const results = await Promise.all(promises);

  results.forEach(result => {
    printerStatusCache[result.id] = result;
  });

  console.log('Printer statuses updated successfully');
}

// Discover printers in IP range
async function discoverPrinters(startIP, endIP) {
  const discoveredPrinters = [];

  // Parse IP addresses
  const startParts = startIP.split('.');
  const endParts = endIP.split('.');

  if (startParts.length !== 4 || endParts.length !== 4) {
    throw new Error('Invalid IP address format');
  }

  const startNum = parseInt(startParts[3]);
  const endNum = parseInt(endParts[3]);
  const subnet = `${startParts[0]}.${startParts[1]}.${startParts[2]}`;

  console.log(`Scanning ${endNum - startNum + 1} IP addresses...`);

  // Scan each IP in range
  for (let i = startNum; i <= endNum; i++) {
    const ip = `${subnet}.${i}`;
    console.log(`Checking ${ip}...`);

    try {
      const printerInfo = await detectPrinter(ip);
      if (printerInfo) {
        discoveredPrinters.push({
          id: discoveredPrinters.length + 1,
          ip: ip,
          ...printerInfo
        });
        console.log(`✓ Found printer at ${ip}: ${printerInfo.model}`);
      }
    } catch (error) {
      // Silently skip non-responsive IPs
    }
  }

  return discoveredPrinters;
}

// Detect if an IP is a printer and get its info
async function detectPrinter(ip) {
  return new Promise((resolve, reject) => {
    const communityStrings = ['v2cpublic', 'public'];
    let currentIndex = 0;

    function tryNextCommunity() {
      if (currentIndex >= communityStrings.length) {
        reject(new Error('Not a printer or SNMP not accessible'));
        return;
      }

      const community = communityStrings[currentIndex];
      currentIndex++;

      const session = snmp.createSession(ip, community, {
        version: snmp.Version2c,
        timeout: 3000,
        retries: 1
      });

      // Query printer-specific OIDs
      const oids = [
        '1.3.6.1.2.1.25.3.2.1.3.1',  // Device description
        '1.3.6.1.2.1.43.5.1.1.16.1', // Printer model
        '1.3.6.1.2.1.43.5.1.1.17.1', // Printer serial
        '1.3.6.1.2.1.1.1.0'          // System description
      ];

      session.get(oids, (error, varbinds) => {
        session.close();

        if (error) {
          tryNextCommunity();
          return;
        }

        // Check if any varbind indicates this is a printer
        let isPrinter = false;
        let model = '';
        let serial = '';
        let manufacturer = '';
        let description = '';

        varbinds.forEach((varbind, index) => {
          if (!snmp.isVarbindError(varbind) && varbind.value) {
            const value = varbind.value.toString();

            if (index === 0 || index === 3) {
              description = value;
              // Check if description contains printer-related keywords
              if (value.toLowerCase().includes('printer') ||
                value.toLowerCase().includes('hp') ||
                value.toLowerCase().includes('pantum') ||
                value.toLowerCase().includes('laserjet')) {
                isPrinter = true;
              }
            }

            if (index === 1) {
              model = value;
            }

            if (index === 2) {
              serial = value;
            }
          }
        });

        if (isPrinter || model) {
          // Detect manufacturer from description or model
          const desc = (description + ' ' + model).toLowerCase();
          if (desc.includes('hp') || desc.includes('hewlett')) {
            manufacturer = 'HP';
          } else if (desc.includes('pantum')) {
            manufacturer = 'PANTUM';
          } else {
            manufacturer = 'Unknown';
          }

          // Extract model name
          if (!model && description) {
            // Try to extract model from description
            const modelMatch = description.match(/([A-Z0-9]+\s*[A-Z0-9]+)/);
            if (modelMatch) {
              model = modelMatch[1];
            }
          }

          resolve({
            name: model || `Printer ${ip}`,
            model: model || 'Unknown Model',
            manufacturer: manufacturer,
            serial: serial || 'Unknown',
            location: `IP ${ip}`,
            communityString: community
          });
        } else {
          tryNextCommunity();
        }
      });
    }

    tryNextCommunity();
  });
}


// API Routes

// Get all printers configuration
app.get('/api/printers', (req, res) => {
  res.json(printersConfig.printers);
});

// Get all printer statuses
app.get('/api/printers/status', (req, res) => {
  const statuses = Object.values(printerStatusCache);
  res.json(statuses);
});

// Get specific printer status
app.get('/api/printers/:id/status', async (req, res) => {
  const printerId = parseInt(req.params.id);
  const printer = printersConfig.printers.find(p => p.id === printerId);

  if (!printer) {
    return res.status(404).json({ error: 'Printer not found' });
  }

  try {
    const status = await getPrinterStatus(printer);
    printerStatusCache[printerId] = status;
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Force refresh all printers
app.post('/api/printers/refresh', async (req, res) => {
  try {
    await updateAllPrinterStatuses();
    res.json({ message: 'Printers refreshed successfully', data: Object.values(printerStatusCache) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get settings
app.get('/api/settings', (req, res) => {
  try {
    const settings = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'config', 'settings.json'), 'utf8')
    );
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save settings
app.post('/api/settings', (req, res) => {
  try {
    const settings = req.body;
    fs.writeFileSync(
      path.join(__dirname, 'config', 'settings.json'),
      JSON.stringify(settings, null, 2)
    );
    res.json({ message: 'Settings saved successfully', settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Discover printers in IP range
app.post('/api/discover', async (req, res) => {
  try {
    const { startIP, endIP } = req.body;

    if (!startIP || !endIP) {
      return res.status(400).json({ error: 'Start IP and End IP are required' });
    }

    console.log(`Starting printer discovery from ${startIP} to ${endIP}...`);

    const discoveredPrinters = await discoverPrinters(startIP, endIP);

    res.json({
      message: `Discovery complete. Found ${discoveredPrinters.length} printers.`,
      printers: discoveredPrinters
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save discovered printers
app.post('/api/printers/save', async (req, res) => {
  try {
    const { printers } = req.body;

    if (!printers || !Array.isArray(printers)) {
      return res.status(400).json({ error: 'Invalid printers data' });
    }

    // Save to printers.json
    const config = { printers };
    fs.writeFileSync(
      path.join(__dirname, 'config', 'printers.json'),
      JSON.stringify(config, null, 2)
    );

    // Reload configuration
    Object.assign(printersConfig, config);

    // Update statuses
    await updateAllPrinterStatuses();

    res.json({
      message: 'Printers saved successfully',
      count: printers.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update printer field
app.patch('/api/printers/:id/update', async (req, res) => {
  try {
    const printerId = parseInt(req.params.id);
    const { field, value } = req.body;

    if (!field || value === undefined) {
      return res.status(400).json({ error: 'Field and value are required' });
    }

    // Validate field
    const allowedFields = ['name', 'location', 'serial'];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: 'Invalid field' });
    }

    // Load current printers
    const configPath = path.join(__dirname, 'config', 'printers.json');
    let config;

    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } else {
      config = { printers: [] };
    }

    // Find and update printer
    const printer = config.printers.find(p => p.id === printerId);
    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' });
    }

    printer[field] = value;

    // Save to file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Reload configuration
    if (config.printers) {
      printersConfig.printers = config.printers;
    }

    // Update cache
    if (printerStatusCache[printerId]) {
      printerStatusCache[printerId][field] = value;
    }

    // Also update the in-memory printer object in the cache if it exists there under the new field value
    if (printersConfig.printers) {
      const cachedPrinter = printersConfig.printers.find(p => p.id === printerId);
      if (cachedPrinter) {
        cachedPrinter[field] = value;
      }
    }

    res.json({
      message: 'Printer updated successfully',
      printer: printer
    });
  } catch (error) {
    console.error('Error updating printer:', error);
    res.status(500).json({ error: error.message });
  }
});


// Initialize server
async function startServer() {
  // Initial update
  await updateAllPrinterStatuses();

  // Schedule automatic updates every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    updateAllPrinterStatuses();
  });

  app.listen(PORT, () => {
    console.log(`Printer Toner Monitor running on http://localhost:${PORT}`);
    console.log(`Monitoring ${printersConfig.printers.length} printers`);
  });
}

startServer();
