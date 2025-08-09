import { Color } from "@/constants";

function getFrame({ size, stroke, frame, background }: { size: number; stroke: string; frame: string; background: string }): string {
  const height = size; // Assuming square frames
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="{{size}}" height="{{height}}" viewBox="0 0 12 12"><path fill="{{stroke}}" d="M2 0h1v1H2zm1 0h1v1H3zm1 0h1v1H4zm1 0h1v1H5zm1 0h1v1H6zm1 0h1v1H7zm1 0h1v1H8zm1 0h1v1H9zM1 1h1v1H1z"/><path fill="{{frame}}" d="M2 1h1v1H2zm1 0h1v1H3zm1 0h1v1H4zm1 0h1v1H5zm1 0h1v1H6zm1 0h1v1H7zm1 0h1v1H8zm1 0h1v1H9z"/><path fill="{{stroke}}" d="M10 1h1v1h-1zM0 2h1v1H0z"/><path fill="{{frame}}" d="M1 2h1v1H1zm1 0h1v1H2z"/><path fill="{{stroke}}" d="M3 2h1v1H3zm1 0h1v1H4zm1 0h1v1H5zm1 0h1v1H6zm1 0h1v1H7zm1 0h1v1H8z"/><path fill="{{frame}}" d="M9 2h1v1H9zm1 0h1v1h-1z"/><path fill="{{stroke}}" d="M11 2h1v1h-1zM0 3h1v1H0z"/><path fill="{{frame}}" d="M1 3h1v1H1z"/><path fill="{{stroke}}" d="M2 3h1v1H2zm1 0h1v1H3zm1 0h1v1H4zm1 0h1v1H5zm1 0h1v1H6zm1 0h1v1H7zm1 0h1v1H8zm1 0h1v1H9z"/><path fill="{{frame}}" d="M10 3h1v1h-1z"/><path fill="{{stroke}}" d="M11 3h1v1h-1zM0 4h1v1H0z"/><path fill="{{frame}}" d="M1 4h1v1H1z"/><path fill="{{stroke}}" d="M2 4h1v1H2zm1 0h1v1H3z"/><path fill="{{background}}" d="M4 4h1v1H4zm1 0h1v1H5zm1 0h1v1H6zm1 0h1v1H7z"/><path fill="{{stroke}}" d="M8 4h1v1H8zm1 0h1v1H9z"/><path fill="{{frame}}" d="M10 4h1v1h-1z"/><path fill="{{stroke}}" d="M11 4h1v1h-1zM0 5h1v1H0z"/><path fill="{{frame}}" d="M1 5h1v1H1z"/><path fill="{{stroke}}" d="M2 5h1v1H2z"/><path fill="{{background}}" d="M3 5h1v1H3zm1 0h1v1H4zm1 0h1v1H5zm1 0h1v1H6zm1 0h1v1H7zm1 0h1v1H8z"/><path fill="{{stroke}}" d="M9 5h1v1H9z"/><path fill="{{frame}}" d="M10 5h1v1h-1z"/><path fill="{{stroke}}" d="M11 5h1v1h-1zM0 6h1v1H0z"/><path fill="{{frame}}" d="M1 6h1v1H1z"/><path fill="{{stroke}}" d="M2 6h1v1H2z"/><path fill="{{background}}" d="M3 6h1v1H3zm1 0h1v1H4zm1 0h1v1H5zm1 0h1v1H6zm1 0h1v1H7zm1 0h1v1H8z"/><path fill="{{stroke}}" d="M9 6h1v1H9z"/><path fill="{{frame}}" d="M10 6h1v1h-1z"/><path fill="{{stroke}}" d="M11 6h1v1h-1zM0 7h1v1H0z"/><path fill="{{frame}}" d="M1 7h1v1H1z"/><path fill="{{stroke}}" d="M2 7h1v1H2z"/><path fill="{{background}}" d="M3 7h1v1H3zm1 0h1v1H4zm1 0h1v1H5zm1 0h1v1H6zm1 0h1v1H7zm1 0h1v1H8z"/><path fill="{{stroke}}" d="M9 7h1v1H9z"/><path fill="{{frame}}" d="M10 7h1v1h-1z"/><path fill="{{stroke}}" d="M11 7h1v1h-1zM0 8h1v1H0z"/><path fill="{{frame}}" d="M1 8h1v1H1zm1 0h1v1H2z"/><path fill="{{stroke}}" d="M3 8h1v1H3zm1 0h1v1H4zm1 0h1v1H5zm1 0h1v1H6zm1 0h1v1H7zm1 0h1v1H8z"/><path fill="{{frame}}" d="M9 8h1v1H9zm1 0h1v1h-1z"/><path fill="{{stroke}}" d="M11 8h1v1h-1zM0 9h1v1H0zm1 0h1v1H1z"/><path fill="{{frame}}" d="M2 9h1v1H2zm1 0h1v1H3zm1 0h1v1H4zm1 0h1v1H5zm1 0h1v1H6zm1 0h1v1H7zm1 0h1v1H8zm1 0h1v1H9z"/><path fill="{{stroke}}" d="M10 9h1v1h-1zm-9 1h1v1H1zm1 0h1v1H2zm1 0h1v1H3zm1 0h1v1H4zm1 0h1v1H5zm1 0h1v1H6zm1 0h1v1H7zm1 0h1v1H8zm1 0h1v1H9zm1 0h1v1h-1zm-8 1h1v1H2zm1 0h1v1H3zm1 0h1v1H4zm1 0h1v1H5zm1 0h1v1H6zm1 0h1v1H7zm1 0h1v1H8zm1 0h1v1H9z"/></svg>'
    .replace(/\{\{size\}\}/g, size.toString())
    .replace(/\{\{height\}\}/g, height.toString())
    .replace(/\{\{stroke\}\}/g, stroke)
    .replace(/\{\{frame\}\}/g, frame)
    .replace(/\{\{background\}\}/g, background);

  // Encode SVG to Base64 safely
  const encodedSvg = encodeURIComponent(svg)
    .replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16)))
    .replace(/#/g, '%23');

  return `data:image/svg+xml;base64,${btoa(encodedSvg)}`;
}

function getCheckbox({ size, color }: { size: number; color: string }) {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="{{width}}" height="{{height}}" viewBox="0 0 12 6"><rect width="1" height="1" x="1" y="0" fill="{{color}}"></rect><rect width="1" height="1" x="2" y="0" fill="{{color}}"></rect><rect width="1" height="1" x="3" y="0" fill="{{color}}"></rect><rect width="1" height="1" x="4" y="0" fill="{{color}}"></rect><rect width="1" height="1" x="7" y="0" fill="{{color}}"></rect><rect width="1" height="1" x="8" y="0" fill="{{color}}"></rect><rect width="1" height="1" x="9" y="0" fill="{{color}}"></rect><rect width="1" height="1" x="10" y="0" fill="{{color}}"></rect><rect width="1" height="1" x="0" y="1" fill="{{color}}"></rect><rect width="1" height="1" x="5" y="1" fill="{{color}}"></rect><rect width="1" height="1" x="6" y="1" fill="{{color}}"></rect><rect width="1" height="1" x="11" y="1" fill="{{color}}"></rect><rect width="1" height="1" x="0" y="2" fill="{{color}}"></rect><rect width="1" height="1" x="2" y="2" fill="{{color}}"></rect><rect width="1" height="1" x="3" y="2" fill="{{color}}"></rect><rect width="1" height="1" x="5" y="2" fill="{{color}}"></rect><rect width="1" height="1" x="6" y="2" fill="{{color}}"></rect><rect width="1" height="1" x="11" y="2" fill="{{color}}"></rect><rect width="1" height="1" x="0" y="3" fill="{{color}}"></rect><rect width="1" height="1" x="2" y="3" fill="{{color}}"></rect><rect width="1" height="1" x="3" y="3" fill="{{color}}"></rect><rect width="1" height="1" x="5" y="3" fill="{{color}}"></rect><rect width="1" height="1" x="6" y="3" fill="{{color}}"></rect><rect width="1" height="1" x="11" y="3" fill="{{color}}"></rect><rect width="1" height="1" x="0" y="4" fill="{{color}}"></rect><rect width="1" height="1" x="5" y="4" fill="{{color}}"></rect><rect width="1" height="1" x="6" y="4" fill="{{color}}"></rect><rect width="1" height="1" x="11" y="4" fill="{{color}}"></rect><rect width="1" height="1" x="1" y="5" fill="{{color}}"></rect><rect width="1" height="1" x="2" y="5" fill="{{color}}"></rect><rect width="1" height="1" x="3" y="5" fill="{{color}}"></rect><rect width="1" height="1" x="4" y="5" fill="{{color}}"></rect><rect width="1" height="1" x="7" y="5" fill="{{color}}"></rect><rect width="1" height="1" x="8" y="5" fill="{{color}}"></rect><rect width="1" height="1" x="9" y="5" fill="{{color}}"></rect><rect width="1" height="1" x="10" y="5" fill="{{color}}"></rect></svg>'
    .replace(/\{\{width\}\}/g, (size*2).toString())
    .replace(/\{\{height\}\}/g, size.toString())
    .replace(/\{\{color\}\}/g, color)
    
  const encodedSvg = encodeURIComponent(svg)
    .replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16)))
    .replace(/#/g, '%23');

  return `data:image/svg+xml;base64,${btoa(encodedSvg)}`;

}

export const frame = getFrame({
  size: 160,
  stroke: Color.Dark,
  frame: Color.Light,
  background: Color.Light,
});

export const checkbox = getCheckbox({
  size: 12,
  color: Color.Dark,
});
export const checkboxLight = getCheckbox({
  size: 12,
  color: Color.Light,
});