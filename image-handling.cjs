const { src, dest } = require('gulp')
const sharp = require('sharp')
const through2 = require('through2')
const path = require('path')

const RASTER_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.tiff']

/**
 * Core transformer factory
 */
function createTransform(format, options = {}) {
  return through2.obj(async (file, _, cb) => {
    try {
      if (file.isNull()) return cb(null, file)
      if (file.isStream()) return cb(new Error('Streams not supported'))

      const ext = path.extname(file.path).toLowerCase()

      // Skip unsupported files
      if (!RASTER_EXT.includes(ext)) {
        return cb(null, file)
      }

      const pipeline = sharp(file.contents)

      const buffer = await pipeline[format](options).toBuffer()

      // Clone to preserve original
      const newFile = file.clone()
      newFile.contents = buffer

      // Normalize extension
      newFile.extname = format === 'jpeg' ? '.jpg' : `.${format}`

      cb(null, newFile)
    } catch (err) {
      cb(err)
    }
  })
}

function copyOriginals() {
  return src('./src/images/**/*').pipe(dest('./dist/images'))
}

function optimizeOriginals() {
  return src('./src/images/**/*.{jpg,jpeg,png}')
    .pipe(
      through2.obj(async (file, _, cb) => {
        try {
          const ext = path.extname(file.path).toLowerCase()

          let pipeline = sharp(file.contents)

          if (ext === '.jpg' || ext === '.jpeg') {
            file.contents = await pipeline
              .jpeg({ quality: 80, mozjpeg: true })
              .toBuffer()
          } else if (ext === '.png') {
            file.contents = await pipeline
              .png({ compressionLevel: 9 })
              .toBuffer()
          }

          cb(null, file)
        } catch (err) {
          cb(err)
        }
      }),
    )
    .pipe(dest('./dist/images'))
}

function toWebp() {
  return src('./src/images/**/*.{jpg,jpeg,png}')
    .pipe(createTransform('webp', { quality: 80 }))
    .pipe(dest('./dist/images'))
}

function toAvif() {
  return src('./src/images/**/*.{jpg,jpeg,png}')
    .pipe(createTransform('avif', { quality: 50 }))
    .pipe(dest('./dist/images'))
}

module.exports.copyOriginals = copyOriginals
module.exports.optimizeOriginals = optimizeOriginals
module.exports.toWebp = toWebp
module.exports.toAvif = toAvif
