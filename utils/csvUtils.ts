
import { FleetItem, FleetType, FleetStatus, MaintenanceRecord } from '../types';

const HEADERS = [
  'Type (VEHICLE/EQUIPMENT)',
  'Make',
  'Model',
  'Year',
  'Plate/Serial',
  'Current Meter (km/hr)',
  'Status (ACTIVE/WORKSHOP)',
  'Category',
  'Location',
  'Assigned To'
];

export const downloadTemplate = () => {
  const csvContent = "data:text/csv;charset=utf-8," + HEADERS.join(",") + "\n" +
    "VEHICLE,Toyota,Hilux,2023,DXB-99999,5000,ACTIVE,Pickup,Main HQ,Driver A";
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "fleet_template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToCSV = (fleet: FleetItem[]) => {
  const rows = fleet.map(item => [
    item.type,
    `"${item.make}"`, // Quote strings to handle commas
    `"${item.model}"`,
    item.year,
    `"${item.plateOrSerial}"`,
    item.currentMeter,
    item.status,
    `"${item.category}"`,
    `"${item.location}"`,
    `"${item.assignedTo || ''}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," 
    + HEADERS.join(",") + "\n" 
    + rows.map(e => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `fleet_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportVehicleHistory = (vehicle: FleetItem, records: MaintenanceRecord[], typeLabel: string) => {
    // 1. Create a Header Section with Vehicle Details
    const headerRows = [
        ['VEHICLE HISTORY REPORT', typeLabel],
        ['Generated On:', new Date().toLocaleDateString()],
        [],
        ['ASSET DETAILS'],
        ['Make/Model', `${vehicle.make} ${vehicle.model}`],
        ['Plate/Serial', vehicle.plateOrSerial],
        ['Type', vehicle.type],
        ['Year', vehicle.year],
        ['Current Meter', vehicle.currentMeter],
        ['Status', vehicle.status],
        ['Location', vehicle.location],
        ['Assigned To', vehicle.assignedTo || 'N/A'],
        ['VIN', vehicle.technicalDetails?.vin || 'N/A'],
        [] // Empty line separator
    ];

    // 2. Create the Table Headers
    const tableHeader = [
        'Date',
        'Type',
        'Meter Reading',
        'Description',
        'Maintenance Items',
        'Parts Used',
        'Technician',
        'Labor Cost',
        'Parts Cost',
        'Total Cost'
    ];

    // 3. Map the records to rows
    const recordRows = records.map(r => [
        r.date,
        r.type,
        r.meterReading,
        `"${r.description.replace(/"/g, '""')}"`, // Escape quotes
        `"${r.maintenanceItems ? r.maintenanceItems.join('; ') : ''}"`, // New column for maintenance items
        `"${r.parts?.replace(/"/g, '""') || ''}"`,
        `"${r.technician || ''}"`,
        r.laborCost,
        r.partsCost,
        r.totalCost
    ]);

    // 4. Combine everything
    const csvArray = [
        ...headerRows.map(row => row.join(',')),
        tableHeader.join(','),
        ...recordRows.map(row => row.join(','))
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvArray.join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    // Sanitize filename
    const safeName = `${vehicle.make}_${vehicle.model}_${typeLabel}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute("download", `${safeName}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const parseCSV = (csvText: string): FleetItem[] => {
  const lines = csvText.split('\n');
  const items: FleetItem[] = [];
  
  // Skip header row (index 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple regex to split by comma but ignore commas inside quotes
    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.trim().replace(/^"|"$/g, ''));

    // Basic validation: ensure we have enough columns
    if (cols.length < 5) continue;

    const typeRaw = cols[0].toUpperCase();
    const type: FleetType = typeRaw.includes('EQUIP') ? 'EQUIPMENT' : 'VEHICLE';
    
    const statusRaw = cols[6]?.toUpperCase() || 'ACTIVE';
    let status: FleetStatus = 'ACTIVE';
    if (statusRaw.includes('WORK')) status = 'WORKSHOP';
    if (statusRaw.includes('OUT')) status = 'OUT_OF_SERVICE';

    const newItem: FleetItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type,
      make: cols[1] || 'Unknown',
      model: cols[2] || 'Unknown',
      year: parseInt(cols[3]) || new Date().getFullYear(),
      plateOrSerial: cols[4] || 'UNKNOWN-ID',
      currentMeter: parseInt(cols[5]) || 0,
      status,
      category: cols[7] || 'General',
      location: cols[8] || 'Main HQ',
      assignedTo: cols[9] || '',
    };

    items.push(newItem);
  }

  return items;
};
