const { series, src, dest, parallel } = require('gulp')
const fs = require('fs')

const gulpSourcemaps = require('gulp-sourcemaps')
const gulpConcat = require('gulp-concat')
const gulpBabel = require('gulp-babel')
const rollup = require('rollup')
const gulpPostcss = require('gulp-postcss')
const commonjs = require('@rollup/plugin-commonjs')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')

function removeDist(cb) {
  fs.rmSync('./dist', { recursive: true, force: true })
  console.log('-- removed dist folder')
  cb()
}

function css(cb) {
  const plugins = [autoprefixer(), cssnano()]
  return src('./src/**/*.css').pipe(gulpPostcss(plugins)).pipe(dest('./dist'))
}

function js(cb) {
  const plugins = []
  return src('./src/js/**/*.js')
    .pipe(gulpSourcemaps.init())
    .pipe(
      gulpBabel({
        presets: [['@babel/env', { modules: false }]],
      }),
    )
    .pipe(gulpSourcemaps.write())
    .pipe(dest('./dist/js'))
}

const inputOptions = {
  input: './dist/js/main.js',
  // plugins: [commonjs()],
}
const outputOptionsList = [
  {
    file: './dist/js/bundle.js',
    format: 'module',
  },
]

async function build() {
  let bundle
  let buildFailed = false
  try {
    bundle = await rollup.rollup(inputOptions)
    console.log(bundle.watchFiles)

    await generateOutputs(bundle)
  } catch (error) {
    buildFailed = true
    console.error(error)
  }
  if (bundle) {
    return await bundle.close()
  }
  process.exit(buildFailed ? 1 : 0)
}

async function generateOutputs(bundle) {
  for (const outputOptions of outputOptionsList) {
    const { output } = await bundle.write(outputOptions)

    for (const chunkOrAsset of output) {
      if (chunkOrAsset.type === 'asset') {
        console.log('Asset', chunkOrAsset)
      } else {
        console.log('Chunk', chunkOrAsset.modules)
      }
    }
  }
}

async function bundle(cb) {
  return await build()
}

exports.removeDist = removeDist
exports.clear = removeDist

exports.css = css
exports.js = js
exports.bundleJs = series(js, bundle)
exports.bundle = bundle
exports.default = css
