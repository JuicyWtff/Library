function lematizar(palabra) {
  let p = palabra;

  if (p.endsWith("ies") && p.length > 4) {
    p = p.slice(0, -3) + "y";
  } else if (p.endsWith("es") && p.length > 4) {
    p = p.slice(0, -2);
  } else if (p.endsWith("s") && !p.endsWith("ss") && p.length > 3) {
    p = p.slice(0, -1);
  }

  if (p.endsWith("ing") && p.length > 5) {
    p = p.slice(0, -3);
  } else if (p.endsWith("ed") && p.length > 4) {
    p = p.slice(0, -2);
  }

  if (p.endsWith("ly") && p.length > 4) {
    p = p.slice(0, -2);
  }

  return p;
}

module.exports = lematizar;