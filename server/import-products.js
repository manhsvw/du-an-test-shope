const path = require('node:path');
const ExcelJS = require('exceljs');
const db = require('./db');

function cellText(cell) {
  const value = cell?.value;
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && 'text' in value) return String(value.text).trim();
  return String(value).trim();
}

function cellNumber(cell, fallback) {
  const text = cellText(cell);
  if (text === '') return fallback;
  const n = Number(text.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

// Chuẩn hoá để so khớp danh mục/danh mục con không bị lệch vì viết hoa/thường,
// khoảng trắng thừa, hay khác cách dựng dấu Unicode (NFC/NFD) khi gõ lại trong Excel.
function normalizeKey(text) {
  return (text || '').normalize('NFC').trim().toLowerCase();
}

async function main() {
  const filePath = path.resolve(
    process.argv[2] || path.join(__dirname, '..', 'data-template', 'mau-nhap-san-pham.xlsx')
  );

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.getWorksheet('SanPham');
  if (!sheet) {
    throw new Error(`Không tìm thấy sheet "SanPham" trong file ${filePath}`);
  }

  const upsert = db.prepare(`
    INSERT INTO products (id, category, subcategory, category_key, subcategory_key, name, brand, origin, description, price, sale_price, stock_qty, image, sold_count, rating, updated_at)
    VALUES (@id, @category, @subcategory, @categoryKey, @subcategoryKey, @name, @brand, @origin, @description, @price, @salePrice, @stockQty, @image, @soldCount, @rating, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      category = excluded.category,
      subcategory = excluded.subcategory,
      category_key = excluded.category_key,
      subcategory_key = excluded.subcategory_key,
      name = excluded.name,
      brand = excluded.brand,
      origin = excluded.origin,
      description = excluded.description,
      price = excluded.price,
      sale_price = excluded.sale_price,
      stock_qty = excluded.stock_qty,
      image = excluded.image,
      sold_count = excluded.sold_count,
      rating = excluded.rating,
      updated_at = datetime('now')
  `);

  let imported = 0;
  let skipped = 0;

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const id = cellText(row.getCell(2));
    const name = cellText(row.getCell(5));

    if (!id || !name) {
      skipped += 1;
      continue;
    }

    const category = cellText(row.getCell(3));
    const subcategory = cellText(row.getCell(4)) || null;

    upsert.run({
      id,
      category,
      subcategory,
      categoryKey: normalizeKey(category),
      subcategoryKey: subcategory ? normalizeKey(subcategory) : null,
      name,
      brand: cellText(row.getCell(6)) || null,
      origin: cellText(row.getCell(7)) || null,
      description: cellText(row.getCell(8)) || null,
      price: cellNumber(row.getCell(9), 0),
      salePrice: cellText(row.getCell(10)) === '' ? null : cellNumber(row.getCell(10), null),
      stockQty: cellNumber(row.getCell(11), 0),
      image: cellText(row.getCell(12)) || null,
      soldCount: cellNumber(row.getCell(13), 0),
      rating: cellNumber(row.getCell(14), 5),
    });
    imported += 1;
  }

  console.log(`Đã nhập/cập nhật ${imported} sản phẩm từ ${filePath}`);
  if (skipped > 0) {
    console.log(`Bỏ qua ${skipped} dòng trống hoặc thiếu mã sản phẩm / tên sản phẩm.`);
  }
}

main().catch((err) => {
  console.error('Import thất bại:', err.message);
  process.exitCode = 1;
});
