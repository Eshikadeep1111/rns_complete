-- Employees reference table
CREATE TABLE IF NOT EXISTS employees (
    emp_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    designation VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed test employees
INSERT INTO employees (emp_id, name, department, designation, phone) VALUES
('EMP001', 'Kiran Verma',       'Engineering',  'Software Engineer',     '+91-9876543210'),
('EMP002', 'Priya Sharma',      'Engineering',  'Senior Developer',      '+91-9876543211'),
('EMP003', 'Rahul Patel',       'Sales',        'Sales Executive',       '+91-9876543212'),
('EMP004', 'Ananya Reddy',      'Operations',   'Field Coordinator',     '+91-9876543213'),
('EMP005', 'Arjun Nair',        'Engineering',  'QA Engineer',           '+91-9876543214'),
('EMP006', 'Meena Iyer',        'HR',           'HR Manager',            '+91-9876543215'),
('EMP007', 'Vikram Singh',      'Sales',        'Regional Manager',      '+91-9876543216'),
('EMP008', 'Deepa Krishnan',    'Operations',   'Delivery Executive',    '+91-9876543217'),
('EMP009', 'Sanjay Gupta',      'Engineering',  'Tech Lead',             '+91-9876543218'),
('EMP010', 'Lakshmi Menon',     'Operations',   'Field Agent',           '+91-9876543219')
ON CONFLICT (emp_id) DO NOTHING;
