const { series, src, dest, parallel } = require('gulp')
const fs = require('fs')

const postcss = require('gulp-postcss')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')
const postcssMergeRules = require('postcss-merge-rules')

function removeDist(cb) {
  fs.rmSync('./dist', { recursive: true, force: true })
  console.log('-- removed dist folder')
  cb()
}

function css(cb) {
  const plugins = [
    autoprefixer(),
    cssnano(),
    // postcssMergeRules(),  // this task is already done by cssnano
  ]
  return src('./src/**/*.css').pipe(postcss(plugins)).pipe(dest('./dist'))
}

exports.removeDist = removeDist
exports.css = css
exports.default = css
