-- Migration to update TEAMMATE roles to MEMBER
UPDATE users SET role = 'MEMBER' WHERE role = 'TEAMMATE';
