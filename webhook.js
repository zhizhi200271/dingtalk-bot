const crypto = require('crypto');
const config = require('./config');

// 验证钉钉签名
function verifySign(timestamp, sign) {
  const stringToSign = `${timestamp}\n${config.DINGTALK_APP_SECRET}`;
  const hmac = crypto.createHmac('sha256', config.DINGTALK_APP_SECRET);
  hmac.update(stringToSign);
  const computedSign = hmac.digest('base64');
  return computedSign === sign;
}

// 处理钉钉推送的消息
function handleWebhook(req, res) {
  const { timestamp, sign } = req.headers;
  
  // 验证签名
  if (!verifySign(timestamp, sign)) {
    return res.status(403).json({ error: '签名验证失败' });
  }

  const message = req.body;
  console.log('📩 收到钉钉消息:', message);

  // 简单回复（后续环节会对接知秋）
  const reply = {
    msgtype: 'text',
    text: {
      content: `你好呀，我是秋秋~ 收到你的消息："${message.text?.content || '空消息'}" 🌸`
    }
  };

  res.json(reply);
}

module.exports = { handleWebhook, verifySign };