const gulp = require('gulp');
const path = require('path');
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;
const less = require('gulp-less');
const notify = require('gulp-notify');
const plumber = require('gulp-plumber');
const runSequence = require('gulp-sequence').use(gulp);
/*项目的目录结构*/
const dirs = {
  dist:'./dist',
  src: './src',
  css: './src/css',
  less: './src/less',
  js: './src/js',
  img: './src/img',
};

/*要处理的文件名*/
const files = {
  lessFiles: './src/less/go.less',
  cssFiles: './src/css/*.css',
  jsFiles: './src/js/*.js',
  imgFiles:'./src/img/*.*'
}

// ------------------开发阶段------------------------------------------------------
gulp.task('start', ['create-directory']); //项目初始化的第一个命令
gulp.task('dev-watch', ['server']); //开始编写项目后开启服务器实时更新

// ------------------生产阶段------------------------------------------------------
gulp.task('prefixer', ['autoprefixer']); //给css文件添加浏览器私有前缀 files.cssFiles ==>> .src/css/
gulp.task('min-css', ['minify-css']); //压缩css文件 files.cssFiles ==>> dist/css/
gulp.task('js-handl', ['js-concat-compress']); //合并计算文件  dirs.js/**/*.js ==>> ./dist/js/concated.js

//-------------------一键生成项目文件-----------------------------------------------

gulp.task('bunld-project',runSequence('clean-dist','compile-less','autoprefixer','minify-css','js-concat-compress','img-handl','zip'))


/*_________________上面为配置项_____________________________________________________*/
/*1、生成项目目录*/
gulp.task('create-directory', () => {
  const mkdirp = require('mkdirp'); //创建文件夹
  for (let i in dirs) {
    mkdirp(dirs[i], err => {
      err ? console.log(err) : console.log('mkdir-->' + dirs[i]);;
    });
  }
});

gulp.task('clean-dist',()=>{
  const clean = require('gulp-clean');
  return gulp.src('./dist', {read: false}).pipe(clean());
});

/*2、css处理*/
//编译less
gulp.task('compile-less', () => {
  return gulp.src(files.lessFiles)
  .pipe(plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
  .pipe(less())
  .pipe(gulp.dest(dirs.css + '/'))
  .pipe(reload({stream: true}));
});


//添加浏览器私有前缀（生产环境）
gulp.task('autoprefixer', () => {
  const postcss = require('gulp-postcss');
  const sourcemaps = require('gulp-sourcemaps');
  const autoprefixer = require('autoprefixer');
  return gulp.src(files.cssFiles)
    .pipe(sourcemaps.init())
    .pipe(postcss([ autoprefixer() ]))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(dirs.css+'/'))
});

// 压缩css(生产环境)
gulp.task('minify-css', function () {
  const minifyCSS = require('gulp-minify-css');
  const rename = require("gulp-rename");
  return gulp.src(dirs.css+'/**/*.css')
    .pipe(minifyCSS({/*keepBreaks: true*/}))
    .pipe(rename(path=>path.basename += '.min'))
    .pipe(gulp.dest('./dist/css/'))
});


// 本地服务器功能，自动刷新（dev）
gulp.task('server', ['compile-less'],()=>{
  browserSync.init({
    server: './'
  });
  gulp.watch(dirs.less+'/**/*.less', ['compile-less']);
  gulp.watch('./*.html').on('change', reload);
  gulp.watch(dirs.js+'/**/*.js').on('change', reload);
});

// js文件--合并--压缩(生产环境)
gulp.task('js-concat-compress', (cb)=>{
  let name = '';
  const concat = require('gulp-concat');
  const uglify = require('gulp-uglify');
  const rename = require("gulp-rename");
  return gulp.src(dirs.js+'/**/*.js')
  .pipe(rename(path=>{path.basename += '';name=path.basename;}))
  .pipe(concat('bundle.js'))//合并后的文件名
  .pipe(uglify())
  .pipe(rename(path=>{
    path.basename = name+'.'+path.basename+'.min';
  }))
  .pipe(gulp.dest('dist/js/')); 
});

// 图片无损压缩
gulp.task('img-handl',()=>{
  const imagemin = require('gulp-imagemin');
  return gulp.src(files.imgFiles)
		.pipe(imagemin())
		.pipe(gulp.dest('./dist/img/'))
});

// 项目打包(生产环境)
gulp.task('zip',()=>{
  const zip = require('gulp-zip');
  return gulp.src(['./*.html','**/dist/**/*.*','!**/node_modules/**/*.*'])
  .pipe(zip('project.zip'))
  .pipe(gulp.dest('./'))
});