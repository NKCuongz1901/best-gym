export const formatNumber = (number: number) => {
  return number.toLocaleString('vi-VN');
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('vi-VN');
};
