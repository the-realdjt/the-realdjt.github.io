import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { readCozeConfig, requestCozeImageAnswer, requestCozeTextAnswer } from './coze-client.js';
import { PublicError } from './errors.js';
import { imageUpload, normalizeUploadError } from './upload-config.js';

dotenv.config();

const DEFAULT_PORT = 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors({
  origin: readAllowedOrigins(process.env)
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', createAsyncHandler(handleTextChat));
app.post('/api/chat-with-image', useImageUpload, createAsyncHandler(handleImageChat));
app.get('/api/nearby-shops', createAsyncHandler(handleNearbyShops));
app.use(handleExpressError);

if (!process.env.VERCEL) {
  app.listen(process.env.PORT || DEFAULT_PORT, () => {
    console.log(`BFF Server Running on http://localhost:${process.env.PORT || DEFAULT_PORT}`);
  });
}

export default app;

function readAllowedOrigins(env) {
  return (env.CORS_ORIGINS || 'https://nanywy.github.io,http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function handleTextChat(req, res) {
  const message = readTextMessage(req.body);
  const config = readCozeConfig(process.env);
  const result = await requestCozeTextAnswer({ config, message });
  res.json(result);
}

async function handleImageChat(req, res) {
  const config = readCozeConfig(process.env);
  const imageFile = readImageFile(req.file);
  const message = readOptionalMessage(req.body);
  const result = await requestCozeImageAnswer({ config, imageFile, message });
  res.json(result);
}

async function handleNearbyShops(req, res) {
  const key = readAmapKey(process.env);
  const location = `${readCoordinate(req.query.lng, 'lng')},${readCoordinate(req.query.lat, 'lat')}`;
  const shops = await searchHealthyShops({ key, location });
  res.json({ shops });
}

function readTextMessage(body) {
  if (!body || typeof body.message !== 'string') {
    throw new PublicError(400, '请求体必须包含字符串 message');
  }

  const message = body.message.trim();
  if (!message) {
    throw new PublicError(400, 'message 不能为空');
  }

  return message;
}

function readOptionalMessage(body) {
  if (!body || typeof body.message === 'undefined') {
    return '';
  }
  if (typeof body.message !== 'string') {
    throw new PublicError(400, 'message 必须是字符串');
  }

  return body.message.trim();
}

function readImageFile(file) {
  if (!file) {
    throw new PublicError(400, '请求必须包含图片文件 image');
  }

  return file;
}

function readAmapKey(env) {
  if (!env.AMAP_WEB_SERVICE_KEY) {
    throw new PublicError(500, '高德 Web 服务 Key 未配置');
  }

  return env.AMAP_WEB_SERVICE_KEY;
}

function readCoordinate(value, name) {
  const coordinate = Number(value);
  if (!Number.isFinite(coordinate)) {
    throw new PublicError(400, `${name} 必须是有效坐标`);
  }

  return coordinate;
}

async function convertGpsToAmapLocation(options) {
  const params = new URLSearchParams({
    coordsys: 'gps',
    key: options.key,
    locations: `${options.lng},${options.lat}`
  });
  const data = await requestAmapJson(`https://restapi.amap.com/v3/assistant/coordinate/convert?${params.toString()}`);

  if (data.status !== '1' || typeof data.locations !== 'string') {
    throw new PublicError(502, '高德坐标转换失败', { info: data.info, infocode: data.infocode });
  }

  return data.locations.split(';')[0];
}

async function searchHealthyShops(options) {
  const keywords = ['轻食', '沙拉', '健康餐', '健身餐', '餐饮', '餐厅'];
  const results = await Promise.all(keywords.map((keyword) => searchAmapAround({ ...options, keyword })));
  const uniqueShops = new Map();

  for (const shop of results.flat()) {
    if (!uniqueShops.has(shop.id || shop.name)) {
      uniqueShops.set(shop.id || shop.name, shop);
    }
  }

  const shops = Array.from(uniqueShops.values())
    .sort((left, right) => Number(left.distance || 0) - Number(right.distance || 0))
    .slice(0, 4)
    .map(formatAmapShop);

  return shops.length > 0 ? shops : readDefaultNearbyShops();
}

async function searchAmapAround(options) {
  const params = new URLSearchParams({
    citylimit: 'false',
    key: options.key,
    keywords: options.keyword,
    location: options.location,
    offset: '5',
    radius: '1000',
    sortrule: 'distance'
  });
  const data = await requestAmapJson(`https://restapi.amap.com/v3/place/around?${params.toString()}`);

  if (data.status !== '1') {
    throw new PublicError(502, '高德周边搜索失败', { info: data.info, infocode: data.infocode });
  }

  return Array.isArray(data.pois) ? data.pois : [];
}

async function requestAmapJson(url) {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new PublicError(response.status, '高德接口请求失败', { status: response.status });
  }

  return data;
}

function formatAmapShop(shop) {
  return {
    distance: shop.distance ? `${shop.distance}m` : '附近',
    name: shop.name || '附近健康店铺',
    note: shop.address || shop.type || '健康餐饮可选'
  };
}

function readDefaultNearbyShops() {
  return [
    { distance: '南门附近', name: '中大轻食推荐', note: '建议选择低油、高蛋白套餐' },
    { distance: '1km 内', name: '校园周边餐饮', note: '优先选择清蒸、白灼、少油菜品' }
  ];
}

function useImageUpload(req, res, next) {
  imageUpload.single('image')(req, res, (error) => {
    if (error) {
      next(normalizeUploadError(error));
      return;
    }
    next();
  });
}

function createAsyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (error) {
      next(error);
    }
  };
}

function handleExpressError(error, _req, res, _next) {
  const statusCode = error instanceof PublicError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : '未知服务器错误';
  const details = error instanceof PublicError ? error.details : {};

  console.error('BFF Error:', message, details);
  res.status(statusCode).json({ details, error: message });
}
