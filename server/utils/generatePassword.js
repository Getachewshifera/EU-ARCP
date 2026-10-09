// Purpose: Shared secure password generation helper.
const crypto = require('crypto');

function generatePassword(length = 12) {
  const safeLength = Number.isInteger(length) && length >= 10 ? length : 12;
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{};:,.?';
  const pool = `${lower}${upper}${digits}${symbols}`;

  const required = [
    lower[crypto.randomInt(lower.length)],
    upper[crypto.randomInt(upper.length)],
    digits[crypto.randomInt(digits.length)],
    symbols[crypto.randomInt(symbols.length)],
  ];

  const characters = Array.from({ length: safeLength - required.length }, () => {
    const index = crypto.randomInt(pool.length);
    return pool[index];
  });

  const password = [...required, ...characters];
  for (let index = password.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.randomInt(index + 1);
    [password[index], password[swapIndex]] = [password[swapIndex], password[index]];
  }

  return password.join('');
}

module.exports = { generatePassword };
