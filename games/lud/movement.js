export async function moveToken(tokenEl, path, startIndex, steps) {
  for (let i = 1; i <= steps; i++) {
    const nextIndex = (startIndex + i) % path.length;
    const cellEl = path[nextIndex].el;
    cellEl.appendChild(tokenEl);
    await new Promise(r => setTimeout(r, 180));
  }
}
