const { series, src, dest, parallel, watch } = require('gulp')
const fs = require('fs')

const gulpSourcemaps = require('gulp-sourcemaps')
const gulpBabel = require('gulp-babel')
const rollup = require('rollup')
const resolve = require('@rollup/plugin-node-resolve')
const gulpPostcss = require('gulp-postcss')
const commonjs = require('@rollup/plugin-commonjs')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')
const terser = require('@rollup/plugin-terser')
const dartSass = require('sass')
const _gulpSass = require('gulp-sass')
const gulpSass = _gulpSass(dartSass)
const gulpRename = require('gulp-rename')
const merge = require('merge-stream')

const siteData = require('./src/pug/data/site-data.cjs')

const gulpPug = require('gulp-pug')
const { toWebp, toAvif, optimizeOriginals } = require('./image-handling.cjs')

function removeDist(cb) {
  fs.rmSync('./dist', { recursive: true, force: true })
  console.log('-- removed dist folder')
  cb()
}

const pugOptions = {
  ...siteData,
}
function pug2html() {
  return src(['./src/pug/*.pug', './src/pug/pages/*.pug'])
    .pipe(gulpPug({ locals: pugOptions, pretty: true }))
    .pipe(dest('./dist'))
}

function css(cb) {
  const plugins = [autoprefixer(), cssnano()]
  return src('./src/**/*.css').pipe(gulpPostcss(plugins)).pipe(dest('./dist'))
}

function scss2css(cb) {
  // Shared processing: init sourcemaps + compile + prefix (once per file)
  const common = src('./src/scss/*.scss')
    .pipe(gulpSourcemaps.init())
    .pipe(gulpSass.sync({}))
    .on('error', gulpSass.logError)
    .pipe(gulpPostcss([autoprefixer()]))

  // Unminified branch: write maps and output
  const unminified = common
    .pipe(gulpSourcemaps.write())
    .pipe(dest('./dist/css'))

  // Minified branch: rename + minify + write maps + output
  const minified = common
    .pipe(gulpRename({ suffix: '.min' }))
    .pipe(gulpPostcss([cssnano()]))
    .pipe(gulpSourcemaps.write())
    .pipe(dest('./dist/css/min'))

  return merge(unminified, minified)
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

const inputOptionsRequiredDependencies = {
  input: './dist/js/required-dependencies.js',
  plugins: [resolve(), commonjs(), terser()],
}
const inputOptionsMain = {
  input: './dist/js/main.js',
  plugins: [resolve(), commonjs()],
}

const outputOptionsListMain = [
  {
    file: './dist/js/bundle.js',
    format: 'esm', // es, module
  },
]
const outputOptionsListRequiredDependencies = [
  {
    file: './dist/js/required-dependencies-bundle.js',
    format: 'esm', // es, module
    globals: {
      swiper: 'Swiper',
    },
  },
]

async function build(rollupOptions, outputOptionsList) {
  let bundle
  let buildFailed = false
  try {
    bundle = await rollup.rollup(rollupOptions)
    console.log(bundle.watchFiles)

    await generateOutputs(bundle, outputOptionsList)
  } catch (error) {
    buildFailed = true
    console.error(error)
  }
  if (bundle) {
    return await bundle.close()
  }
  process.exit(buildFailed ? 1 : 0)
}

async function generateOutputs(bundle, outputOptionsList) {
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

async function bundleMain(cb) {
  return await build(inputOptionsMain, outputOptionsListMain)
}
async function bundleRequiredDependencies(cb) {
  return await build(
    inputOptionsRequiredDependencies,
    outputOptionsListRequiredDependencies,
  )
}

exports.removeDist = removeDist
exports.clear = removeDist

exports.css = css
exports.js = js
exports.bundleAllJs = series(js, bundleRequiredDependencies, bundleMain)
exports.bundleRequiredDependenciesJs = series(js, bundleRequiredDependencies)
exports.bundleMainJs = series(js, bundleMain)
exports.pug2html = pug2html
exports.scss2css = scss2css
exports.optimizeImagesOOriginals = optimizeOriginals
exports.optimizeImagesOWebp = toWebp
exports.optimizeImagesOAvif = toAvif

exports.default = function () {
  watch('./src/js/**/*.js', series(js, bundleMain))
  watch('./src/scss/**', scss2css)
}
