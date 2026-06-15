import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Alert from './Alert';
import { Columns, Col } from './Columns';
import ImageCard from './ImageCard';
import { ThemeContext } from '../contexts/themeContextStore';
import { TableContext } from '../lib/htmlParser';

const themeValue = {
  isDark: false,
  toggleTheme: () => {},
  isSidebarOpen: false,
  setSidebarOpen: () => {},
  isSearchOpen: false,
  setSearchOpen: () => {},
};

test('Alert renders localized title and children inside a theme provider', () => {
  const html = renderToStaticMarkup(
    <ThemeContext.Provider value={themeValue}>
      <Alert type="warning"><span>Check this</span></Alert>
    </ThemeContext.Provider>,
  );

  assert.match(html, /Предупреждение/);
  assert.match(html, /Check this/);
});

test('Columns renders responsive grid styles and reverses image-right children', () => {
  const html = renderToStaticMarkup(
    <Columns layout="image-right">
      <Col>Text</Col>
      <Col>Image</Col>
    </Columns>,
  );

  assert.match(html, /grid-template-columns: 1\.6fr 1fr/);
  assert.ok(html.indexOf('Image') < html.indexOf('Text'));
});

test('ImageCard reads dark mode from TableContext and renders caption', () => {
  const html = renderToStaticMarkup(
    <TableContext.Provider value={{ isDark: true }}>
      <ImageCard src="/picture.png" alt="Picture" title="Caption" />
    </TableContext.Provider>,
  );

  assert.match(html, /src="\/picture\.png"/);
  assert.match(html, /alt="Picture"/);
  assert.match(html, /Caption/);
});
