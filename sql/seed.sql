-- seed.sql — Realistic manufacturing inventory data

-- ─── Tables ────────────────────────────────────────────

CREATE TABLE machines (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE parts (
  id INTEGER PRIMARY KEY,
  part_number TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 5,
  machine_id INTEGER,
  category TEXT NOT NULL DEFAULT 'General',
  last_updated TEXT NOT NULL,
  FOREIGN KEY(machine_id) REFERENCES machines(id)
);

CREATE TABLE transactions (
  id INTEGER PRIMARY KEY,
  part_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  timestamp TEXT NOT NULL,
  notes TEXT,
  FOREIGN KEY(part_id) REFERENCES parts(id)
);

CREATE TABLE inventory_log (
  id INTEGER PRIMARY KEY,
  part_id INTEGER NOT NULL,
  old_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  changed_at TEXT NOT NULL,
  FOREIGN KEY(part_id) REFERENCES parts(id)
);

-- ─── Machines ──────────────────────────────────────────

INSERT INTO machines VALUES (1, 'CNC Mill Alpha',       'Bay 1', 'active');
INSERT INTO machines VALUES (2, 'Lathe Bravo',          'Bay 2', 'active');
INSERT INTO machines VALUES (3, '3D Printer Charlie',   'Bay 3', 'maintenance');
INSERT INTO machines VALUES (4, 'Laser Cutter Delta',   'Bay 4', 'active');
INSERT INTO machines VALUES (5, 'Press Echo',           'Bay 5', 'idle');

-- ─── Parts ─────────────────────────────────────────────

INSERT INTO parts VALUES (1,  'BRG-2205-SS',    '2205 Stainless Steel Ball Bearing',        24,  10, 1, 'Bearings',     '2026-07-10');
INSERT INTO parts VALUES (2,  'BRG-6204-2RS',   '6204 Sealed Deep Groove Bearing',          18,   8, 1, 'Bearings',     '2026-07-09');
INSERT INTO parts VALUES (3,  'BLT-M8X40-GR8',  'M8x40 Grade 8 Hex Bolt',                 150,  50, 1, 'Fasteners',    '2026-07-11');
INSERT INTO parts VALUES (4,  'NUT-M8-FLG',     'M8 Flanged Lock Nut',                    200,  50, 1, 'Fasteners',    '2026-07-11');
INSERT INTO parts VALUES (5,  'FLT-HEPA-04',    'HEPA Filter Cartridge 4-inch',              6,   4, 3, 'Filters',      '2026-07-08');
INSERT INTO parts VALUES (6,  'FLT-OIL-HYD',    'Hydraulic Oil Filter Element',              3,   5, 2, 'Filters',      '2026-07-07');
INSERT INTO parts VALUES (7,  'MOT-NEMA17-48',  'NEMA 17 Stepper Motor 48mm',               12,   4, 3, 'Motors',       '2026-07-10');
INSERT INTO parts VALUES (8,  'MOT-SERVO-750',  '750W AC Servo Motor',                       4,   2, 1, 'Motors',       '2026-07-06');
INSERT INTO parts VALUES (9,  'BLT-TIMING-3M',  '3M HTD Timing Belt 450mm',                  8,   3, 2, 'Belts',        '2026-07-09');
INSERT INTO parts VALUES (10, 'BLT-V-A68',      'A68 V-Belt Classical Section',               5,   3, 5, 'Belts',        '2026-07-05');
INSERT INTO parts VALUES (11, 'SEN-PROX-M12',   'M12 Inductive Proximity Sensor',           10,   4, 4, 'Sensors',      '2026-07-10');
INSERT INTO parts VALUES (12, 'SEN-TEMP-K',     'Type K Thermocouple Probe',                 7,   3, 4, 'Sensors',      '2026-07-08');
INSERT INTO parts VALUES (13, 'SEN-FLOW-DN25',  'DN25 Turbine Flow Sensor',                  2,   2, 5, 'Sensors',      '2026-07-04');
INSERT INTO parts VALUES (14, 'CUT-EM-D6',      '6mm Solid Carbide End Mill 4-Flute',       15,   5, 1, 'Cutting Tools','2026-07-11');
INSERT INTO parts VALUES (15, 'CUT-EM-D10',     '10mm Solid Carbide End Mill 2-Flute',      10,   5, 1, 'Cutting Tools','2026-07-11');
INSERT INTO parts VALUES (16, 'CUT-DRILL-5.5',  '5.5mm Cobalt Drill Bit',                  20,   8, 1, 'Cutting Tools','2026-07-10');
INSERT INTO parts VALUES (17, 'CUT-TAP-M6',     'M6x1.0 Spiral Point Tap HSS-E',           12,   4, 1, 'Cutting Tools','2026-07-09');
INSERT INTO parts VALUES (18, 'CUT-INSERT-CNMG','CNMG 120408 Carbide Insert TiAlN',        30,  10, 2, 'Cutting Tools','2026-07-11');
INSERT INTO parts VALUES (19, 'PNU-CYL-32X100', 'Pneumatic Cylinder 32mm Bore 100mm Stroke', 6,   2, 5, 'Pneumatics',   '2026-07-07');
INSERT INTO parts VALUES (20, 'PNU-SOL-5/2',    '5/2 Solenoid Valve 24VDC',                  8,   3, 5, 'Pneumatics',   '2026-07-06');
INSERT INTO parts VALUES (21, 'HYD-PUMP-A10V',  'Axial Piston Hydraulic Pump 28cc/rev',      2,   1, 2, 'Hydraulics',   '2026-07-03');
INSERT INTO parts VALUES (22, 'HYD-HOSE-3/8',   '3/8" Hydraulic Hose Assembly 1m',          14,   6, 2, 'Hydraulics',   '2026-07-09');
INSERT INTO parts VALUES (23, 'ELC-VFD-7.5KW',  '7.5kW Variable Frequency Drive',            3,   1, 1, 'Electrical',   '2026-07-05');
INSERT INTO parts VALUES (24, 'ELC-RELAY-24V',   '24V DC Relay with Socket Base',            16,   6, 4, 'Electrical',   '2026-07-10');
INSERT INTO parts VALUES (25, 'ELC-FUSE-10A',   '10A Blade Fuse',                           40,  15, 4, 'Electrical',   '2026-07-11');
INSERT INTO parts VALUES (26, 'LUB-GRSE-EP2',   'EP2 Lithium Complex Grease 400g',          10,   4, 1, 'Lubricants',   '2026-07-08');
INSERT INTO parts VALUES (27, 'LUB-OIL-WAY68',  'Way Oil ISO 68 1L',                         8,   3, 2, 'Lubricants',   '2026-07-07');
INSERT INTO parts VALUES (28, 'SAF-GLOVE-L',    'Cut-Resistant Gloves Large (pair)',         22,  10, NULL, 'Safety',    '2026-07-11');
INSERT INTO parts VALUES (29, 'SAF-GLASS-CLR',  'Clear Safety Glasses ANSI Z87',            15,   8, NULL, 'Safety',    '2026-07-10');
INSERT INTO parts VALUES (30, 'SAF-EAR-NRR32',  'Earplugs NRR 32dB (box of 200)',            4,   2, NULL, 'Safety',    '2026-07-09');
INSERT INTO parts VALUES (31, 'NOZ-LASER-1.5',  '1.5mm Laser Cutting Nozzle Copper',        10,   4, 4, 'Consumables',  '2026-07-10');
INSERT INTO parts VALUES (32, 'NOZ-3DP-0.4',    '0.4mm Hardened Steel 3D Printer Nozzle',    6,   3, 3, 'Consumables',  '2026-07-08');
INSERT INTO parts VALUES (33, 'FIL-PLA-BLK',    'PLA Filament 1.75mm Black 1kg',             5,   2, 3, 'Consumables',  '2026-07-07');
INSERT INTO parts VALUES (34, 'FIL-PETG-WHT',   'PETG Filament 1.75mm White 1kg',            3,   2, 3, 'Consumables',  '2026-07-06');
INSERT INTO parts VALUES (35, 'GAS-AR-PURE',    'Argon Gas Cylinder (Size T)',                2,   1, 4, 'Gases',        '2026-07-04');

-- ─── Transactions ──────────────────────────────────────

INSERT INTO transactions VALUES (1,  1,  'received',  50, '2026-06-01 08:30:00', 'Initial stock from SKF order');
INSERT INTO transactions VALUES (2,  1,  'issued',    10, '2026-06-15 14:20:00', 'CNC spindle rebuild');
INSERT INTO transactions VALUES (3,  1,  'issued',     8, '2026-07-02 09:10:00', 'Preventive maintenance Bay 1');
INSERT INTO transactions VALUES (4,  1,  'issued',     8, '2026-07-10 11:30:00', 'Monthly PM cycle');
INSERT INTO transactions VALUES (5,  3,  'received', 200, '2026-06-01 08:30:00', 'Bulk fastener order');
INSERT INTO transactions VALUES (6,  3,  'issued',    30, '2026-06-20 10:00:00', 'Frame assembly project');
INSERT INTO transactions VALUES (7,  3,  'issued',    20, '2026-07-11 08:15:00', 'Fixture rebuild');
INSERT INTO transactions VALUES (8,  5,  'received',  12, '2026-05-15 09:00:00', 'Quarterly filter stock');
INSERT INTO transactions VALUES (9,  5,  'issued',     3, '2026-06-15 13:00:00', 'Scheduled filter change');
INSERT INTO transactions VALUES (10, 5,  'issued',     3, '2026-07-08 13:45:00', 'Scheduled filter change');
INSERT INTO transactions VALUES (11, 6,  'received',   8, '2026-05-10 10:00:00', 'Hydraulic filter restock');
INSERT INTO transactions VALUES (12, 6,  'issued',     2, '2026-06-10 14:00:00', 'Lathe hydraulic service');
INSERT INTO transactions VALUES (13, 6,  'issued',     3, '2026-07-07 09:30:00', 'Emergency filter change');
INSERT INTO transactions VALUES (14, 7,  'received',  20, '2026-05-20 11:00:00', 'Stepper motor bulk order');
INSERT INTO transactions VALUES (15, 7,  'issued',     4, '2026-06-18 15:30:00', '3D printer X/Y axis swap');
INSERT INTO transactions VALUES (16, 7,  'issued',     4, '2026-07-10 10:00:00', 'Printer upgrade project');
INSERT INTO transactions VALUES (17, 8,  'received',   6, '2026-04-01 09:00:00', 'Servo motor procurement');
INSERT INTO transactions VALUES (18, 8,  'issued',     2, '2026-07-06 16:00:00', 'CNC axis replacement');
INSERT INTO transactions VALUES (19, 14, 'received',  25, '2026-06-05 08:00:00', 'Cutting tool restock');
INSERT INTO transactions VALUES (20, 14, 'issued',     5, '2026-06-25 11:30:00', 'Aluminum batch job');
INSERT INTO transactions VALUES (21, 14, 'issued',     5, '2026-07-11 09:00:00', 'Stainless steel project');
INSERT INTO transactions VALUES (22, 18, 'received',  50, '2026-06-01 08:30:00', 'Insert bulk order');
INSERT INTO transactions VALUES (23, 18, 'issued',    10, '2026-06-20 14:00:00', 'Lathe turning jobs');
INSERT INTO transactions VALUES (24, 18, 'issued',    10, '2026-07-11 10:30:00', 'High-volume turning run');
INSERT INTO transactions VALUES (25, 19, 'issued',     1, '2026-07-07 11:00:00', 'Press jig repair');
INSERT INTO transactions VALUES (26, 22, 'received',  20, '2026-06-10 09:00:00', 'Hose assembly stock');
INSERT INTO transactions VALUES (27, 22, 'issued',     3, '2026-06-28 14:30:00', 'Lathe hose replacement');
INSERT INTO transactions VALUES (28, 22, 'issued',     3, '2026-07-09 10:00:00', 'Hydraulic system PM');
INSERT INTO transactions VALUES (29, 24, 'received',  20, '2026-06-15 08:30:00', 'Relay restock');
INSERT INTO transactions VALUES (30, 24, 'issued',     4, '2026-07-10 13:00:00', 'Control panel rewire');
INSERT INTO transactions VALUES (31, 25, 'received',  60, '2026-06-01 08:30:00', 'Fuse bulk order');
INSERT INTO transactions VALUES (32, 25, 'issued',    10, '2026-06-30 11:00:00', 'Panel maintenance');
INSERT INTO transactions VALUES (33, 25, 'issued',    10, '2026-07-11 15:00:00', 'Laser cutter panel');
INSERT INTO transactions VALUES (34, 26, 'received',  15, '2026-06-01 09:00:00', 'Grease restock');
INSERT INTO transactions VALUES (35, 26, 'issued',     3, '2026-06-30 08:00:00', 'Monthly greasing');
INSERT INTO transactions VALUES (36, 26, 'issued',     2, '2026-07-08 08:00:00', 'Spindle bearing grease');
INSERT INTO transactions VALUES (37, 28, 'received',  30, '2026-06-01 08:00:00', 'Safety gear order');
INSERT INTO transactions VALUES (38, 28, 'issued',     4, '2026-06-15 07:30:00', 'New hires');
INSERT INTO transactions VALUES (39, 28, 'issued',     4, '2026-07-11 07:30:00', 'Replacements');
INSERT INTO transactions VALUES (40, 31, 'received',  15, '2026-06-05 09:00:00', 'Nozzle restock');
INSERT INTO transactions VALUES (41, 31, 'issued',     3, '2026-06-28 14:00:00', 'Nozzle wear replacement');
INSERT INTO transactions VALUES (42, 31, 'issued',     2, '2026-07-10 14:00:00', 'Thick plate cutting');
INSERT INTO transactions VALUES (43, 33, 'received',   8, '2026-06-10 10:00:00', 'Filament order');
INSERT INTO transactions VALUES (44, 33, 'issued',     2, '2026-07-01 11:00:00', 'Prototype batch');
INSERT INTO transactions VALUES (45, 33, 'issued',     1, '2026-07-07 15:00:00', 'Jig prototype');
INSERT INTO transactions VALUES (46, 34, 'received',   5, '2026-06-10 10:00:00', 'PETG filament order');
INSERT INTO transactions VALUES (47, 34, 'issued',     1, '2026-06-25 14:00:00', 'Chemical-resistant part');
INSERT INTO transactions VALUES (48, 34, 'issued',     1, '2026-07-06 14:00:00', 'Heat-resistant bracket');
INSERT INTO transactions VALUES (49, 35, 'received',   3, '2026-05-01 09:00:00', 'Gas cylinder delivery');
INSERT INTO transactions VALUES (50, 35, 'issued',     1, '2026-07-04 10:00:00', 'Welding project');
INSERT INTO transactions VALUES (51, 9,  'received',  12, '2026-06-01 08:00:00', 'Belt restock');
INSERT INTO transactions VALUES (52, 9,  'issued',     2, '2026-06-20 10:00:00', 'Lathe belt change');
INSERT INTO transactions VALUES (53, 9,  'issued',     2, '2026-07-09 09:00:00', 'Preventive replacement');
INSERT INTO transactions VALUES (54, 11, 'received',  15, '2026-06-05 08:30:00', 'Sensor restock');
INSERT INTO transactions VALUES (55, 11, 'issued',     3, '2026-06-30 14:00:00', 'Laser cutter sensor swap');
INSERT INTO transactions VALUES (56, 11, 'issued',     2, '2026-07-10 13:30:00', 'Sensor calibration set');

-- ─── Inventory Log ─────────────────────────────────────

INSERT INTO inventory_log VALUES (1,  1,  50, 40, '2026-06-15 14:20:00');
INSERT INTO inventory_log VALUES (2,  1,  40, 32, '2026-07-02 09:10:00');
INSERT INTO inventory_log VALUES (3,  1,  32, 24, '2026-07-10 11:30:00');
INSERT INTO inventory_log VALUES (4,  3, 200,170, '2026-06-20 10:00:00');
INSERT INTO inventory_log VALUES (5,  3, 170,150, '2026-07-11 08:15:00');
INSERT INTO inventory_log VALUES (6,  5,  12,  9, '2026-06-15 13:00:00');
INSERT INTO inventory_log VALUES (7,  5,   9,  6, '2026-07-08 13:45:00');
INSERT INTO inventory_log VALUES (8,  6,   8,  6, '2026-06-10 14:00:00');
INSERT INTO inventory_log VALUES (9,  6,   6,  3, '2026-07-07 09:30:00');
INSERT INTO inventory_log VALUES (10, 7,  20, 16, '2026-06-18 15:30:00');
INSERT INTO inventory_log VALUES (11, 7,  16, 12, '2026-07-10 10:00:00');
INSERT INTO inventory_log VALUES (12, 14, 25, 20, '2026-06-25 11:30:00');
INSERT INTO inventory_log VALUES (13, 14, 20, 15, '2026-07-11 09:00:00');
INSERT INTO inventory_log VALUES (14, 18, 50, 40, '2026-06-20 14:00:00');
INSERT INTO inventory_log VALUES (15, 18, 40, 30, '2026-07-11 10:30:00');
INSERT INTO inventory_log VALUES (16, 22, 20, 17, '2026-06-28 14:30:00');
INSERT INTO inventory_log VALUES (17, 22, 17, 14, '2026-07-09 10:00:00');
INSERT INTO inventory_log VALUES (18, 24, 20, 16, '2026-07-10 13:00:00');
INSERT INTO inventory_log VALUES (19, 25, 60, 50, '2026-06-30 11:00:00');
INSERT INTO inventory_log VALUES (20, 25, 50, 40, '2026-07-11 15:00:00');
INSERT INTO inventory_log VALUES (21, 31, 15, 12, '2026-06-28 14:00:00');
INSERT INTO inventory_log VALUES (22, 31, 12, 10, '2026-07-10 14:00:00');
INSERT INTO inventory_log VALUES (23, 33,  8,  6, '2026-07-01 11:00:00');
INSERT INTO inventory_log VALUES (24, 33,  6,  5, '2026-07-07 15:00:00');
