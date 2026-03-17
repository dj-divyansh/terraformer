const dataService = require('../services/dataService');
const { filterData, sortData, selectFields } = require('../utils/apiFeatures');

/**
 * Get all resources across all groups
 */
exports.getAllResources = async (req, res, next) => {
  try {
    const allData = await dataService.getAllResources();
    
    // Consolidate into a single array for global search
    let resources = [];
    Object.keys(allData).forEach(group => {
      resources = resources.concat(allData[group].map(item => ({...item, _group: group})));
    });

    // Filtering
    let filtered = filterData(resources, req.query);

    // Sorting
    if (req.query.sort) {
      filtered = sortData(filtered, req.query.sort);
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = filtered.length;

    // Field selection
    if (req.query.fields) {
      filtered = selectFields(filtered, req.query.fields);
    }

    const results = filtered.slice(startIndex, endIndex);

    res.status(200).json({
      status: 'success',
      results: results.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: results
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get resources for a specific group (vm, disk, nic)
 */
exports.getResourceGroup = async (req, res, next) => {
  try {
    const { group } = req.params;
    const allData = await dataService.getAllResources();
    
    if (!allData[group]) {
      return res.status(404).json({
        status: 'fail',
        message: `Resource group '${group}' not found. Available groups: ${Object.keys(allData).join(', ')}`
      });
    }

    let resources = allData[group];

    // Debug logging for test
    if (process.env.NODE_ENV === 'test') {
       console.log('Test Query:', JSON.stringify(req.query));
    }

    // Filtering
    let filtered = filterData(resources, req.query);

    // Sorting
    if (req.query.sort) {
      filtered = sortData(filtered, req.query.sort);
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = filtered.length;

    // Field selection
    if (req.query.fields) {
      filtered = selectFields(filtered, req.query.fields);
    }

    const results = filtered.slice(startIndex, endIndex);

    res.status(200).json({
      status: 'success',
      results: results.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: results
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get a specific resource by ID within a group
 */
exports.getResourceById = async (req, res, next) => {
  try {
    const { group, id } = req.params;
    const allData = await dataService.getAllResources();

    if (!allData[group]) {
      return res.status(404).json({
        status: 'fail',
        message: `Resource group '${group}' not found.`
      });
    }

    const resource = allData[group].find(item => item.id === id || item.name === id);

    if (!resource) {
      return res.status(404).json({
        status: 'fail',
        message: `Resource not found with ID/Name: ${id}`
      });
    }

    res.status(200).json({
      status: 'success',
      data: resource
    });
  } catch (err) {
    next(err);
  }
};
