const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileType: { type: String },
  fileSize: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
