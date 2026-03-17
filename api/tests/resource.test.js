const request = require('supertest');
const app = require('../src/app');
const dataService = require('../src/services/dataService');

// Mock dataService
jest.mock('../src/services/dataService');

const mockData = {
  vm: [
    { id: 'vm1', name: 'test-vm-1', type: 'azurerm_linux_virtual_machine', location: 'eastus', resource_group: 'rg1', size: 2, disable_password_authentication: true },
    { id: 'vm2', name: 'test-vm-2', type: 'azurerm_linux_virtual_machine', location: 'westus', resource_group: 'rg2', size: 4, disable_password_authentication: false }
  ],
  disk: [
    { id: 'disk1', name: 'os-disk-1', type: 'azurerm_managed_disk', disk_size_gb: 30 },
    { id: 'disk2', name: 'data-disk-1', type: 'azurerm_managed_disk', disk_size_gb: 100 }
  ]
};

describe('Resource API', () => {
  beforeEach(() => {
    dataService.getAllResources.mockResolvedValue(mockData);
  });

  describe('GET /api/v1/resources', () => {
    it('should return all resources combined', async () => {
      const res = await request(app).get('/api/v1/resources');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.results).toBe(4); // 2 VMs + 2 Disks
      expect(res.body.data[0]).toHaveProperty('_group');
    });

    it('should filter by location', async () => {
      const res = await request(app).get('/api/v1/resources?location=eastus');
      expect(res.statusCode).toBe(200);
      expect(res.body.results).toBe(1);
      expect(res.body.data[0].name).toBe('test-vm-1');
    });
  });

  describe('GET /api/v1/resources/:group', () => {
    it('should return resources for a specific group', async () => {
      const res = await request(app).get('/api/v1/resources/vm');
      expect(res.statusCode).toBe(200);
      expect(res.body.results).toBe(2);
      expect(res.body.data[0].type).toBe('azurerm_linux_virtual_machine');
    });

    it('should return 404 for unknown group', async () => {
      const res = await request(app).get('/api/v1/resources/unknown');
      expect(res.statusCode).toBe(404);
    });

    it('should support range filtering', async () => {
      const res = await request(app).get('/api/v1/resources/disk').query({ disk_size_gb: { gte: 50 } });
      expect(res.statusCode).toBe(200);
      expect(res.body.results).toBe(1);
      expect(res.body.data[0].name).toBe('data-disk-1');
    });

    it('should support partial match filtering', async () => {
      const res = await request(app).get('/api/v1/resources/vm?name[like]=vm-1');
      expect(res.statusCode).toBe(200);
      expect(res.body.results).toBe(1);
      expect(res.body.data[0].id).toBe('vm1');
    });

    it('should support boolean filtering', async () => {
      const res = await request(app).get('/api/v1/resources/vm?disable_password_authentication=true');
      expect(res.statusCode).toBe(200);
      expect(res.body.results).toBe(1);
      expect(res.body.data[0].id).toBe('vm1');
    });

    it('should support sorting and pagination', async () => {
      const res = await request(app).get('/api/v1/resources/vm?sort=-size&limit=1&page=1');
      expect(res.statusCode).toBe(200);
      expect(res.body.results).toBe(1);
      expect(res.body.total).toBe(2);
      expect(res.body.data[0].id).toBe('vm2'); // size 4 first
    });
  });

  describe('GET /api/v1/resources/:group/:id', () => {
    it('should return a specific resource', async () => {
      const res = await request(app).get('/api/v1/resources/vm/vm1');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('test-vm-1');
    });

    it('should return 404 if resource not found', async () => {
      const res = await request(app).get('/api/v1/resources/vm/nonexistent');
      expect(res.statusCode).toBe(404);
    });
  });
});
