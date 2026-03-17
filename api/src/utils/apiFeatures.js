/**
 * Advanced query filtering utility
 */
const filterData = (data, query) => {
  let filtered = [...data];

  // Exclude pagination and sorting params
  const excludeFields = ['page', 'limit', 'sort', 'fields'];
  
  // Advanced filtering
  Object.keys(query).forEach(key => {
    if (excludeFields.includes(key)) return;

    const value = query[key];

    // Boolean filtering
    if (value === 'true') {
      filtered = filtered.filter(item => item[key] === true);
      return;
    }
    if (value === 'false') {
      filtered = filtered.filter(item => item[key] === false);
      return;
    }

    // Range filtering (e.g. disk_size_gb[gte]=30)
    if (typeof value === 'object' && value !== null) {
      if (value.gte) filtered = filtered.filter(item => Number(item[key]) >= Number(value.gte));
      if (value.gt) filtered = filtered.filter(item => Number(item[key]) > Number(value.gt));
      if (value.lte) filtered = filtered.filter(item => Number(item[key]) <= Number(value.lte));
      if (value.lt) filtered = filtered.filter(item => Number(item[key]) < Number(value.lt));
      if (value.ne) filtered = filtered.filter(item => item[key] != value.ne);
      if (value.in) {
        const options = value.in.split(',');
        filtered = filtered.filter(item => options.includes(String(item[key])));
      }
      if (value.like) {
        filtered = filtered.filter(item => 
          String(item[key]).toLowerCase().includes(value.like.toLowerCase())
        );
      }
      return;
    }

    // Exact match (default)
    filtered = filtered.filter(item => String(item[key]) === String(value));
  });

  return filtered;
};

/**
 * Sorting utility
 */
const sortData = (data, sortQuery) => {
  if (!sortQuery) return data;

  const sortBy = sortQuery.split(',').join(' ');
  const sortFields = sortBy.split(' ');

  return data.sort((a, b) => {
    for (const field of sortFields) {
      const isDesc = field.startsWith('-');
      const key = isDesc ? field.substring(1) : field;
      
      if (a[key] < b[key]) return isDesc ? 1 : -1;
      if (a[key] > b[key]) return isDesc ? -1 : 1;
    }
    return 0;
  });
};

/**
 * Field selection utility
 */
const selectFields = (data, fieldsQuery) => {
  if (!fieldsQuery) return data;

  const fields = fieldsQuery.split(',');
  return data.map(item => {
    const selected = {};
    fields.forEach(field => {
      if (item[field] !== undefined) selected[field] = item[field];
    });
    return selected;
  });
};

module.exports = {
  filterData,
  sortData,
  selectFields
};
