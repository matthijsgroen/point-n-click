const hash = (input: any): string => {
  const str = JSON.stringify(input, function (key, value) {
    if (typeof this[key] === "function") {
      return value.toString();
    }
    return value;
  });

  let hash = 0;
  if (str.length == 0) {
    return hash.toString(36);
  }
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
};

export default hash;
