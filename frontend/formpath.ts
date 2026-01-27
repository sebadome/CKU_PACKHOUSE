export const getValueByPath = (obj: any, path: string) =>
  path.split('.').reduce((acc, key) => acc?.[key], obj);

export const setValueByPath = (obj: any, path: string, value: any) => {
  const keys = path.split('.');
  const last = keys.pop()!;
  const target = keys.reduce((acc, key) => {
    if (!acc[key]) acc[key] = {};
    return acc[key];
  }, obj);
  target[last] = value;
};
