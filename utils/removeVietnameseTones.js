export default function removeVietnameseTones(str) {
  return str
    .normalize("NFD") // tách dấu
    .replace(/[\u0300-\u036f]/g, "") // xoá dấu
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^0-9a-zA-Z\s]/g, "") // loại ký tự đặc biệt
    .trim();
}
