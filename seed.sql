INSERT INTO membership_plans (duration, session_type, price)
VALUES
('day','single',2000),
('day','double',3000),
('week','single',8000),
('week','double',10000),
('month','single',30000),
('month','double',35000)
ON CONFLICT (duration, session_type) DO NOTHING;
