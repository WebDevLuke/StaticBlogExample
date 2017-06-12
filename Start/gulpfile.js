//--------------------------------------------------------------------------------------------------------------------------------------
// STATIC BLOG FUNCTIONS
//--------------------------------------------------------------------------------------------------------------------------------------

/*
Gulp functions to generate static blog
*/

//--------------------------------------------------------------------------------------------------------------------------------------
// SET DEPENDENCIES
//--------------------------------------------------------------------------------------------------------------------------------------

// Required for all tasks
const gulp = require('gulp');
// Required for SASS tags
const sass = require('gulp-sass');
// Adds support for SASS globbing
const sassGlob = require('gulp-sass-glob');
// Used to create synchronous build tasks
const runSequence = require('run-sequence');
// Used to delete folders during build process
const del = require('del');
// Used to make directories
const mkdirp = require('mkdirp');
// Used to make local dev server
const webserver = require('gulp-webserver');
// Used to rename CSS and JS depending if minified
const rename = require("gulp-rename");



















//--------------------------------------------------------------------------------------------------------------------------------------
// SECONDARY GULP TASKS
//--------------------------------------------------------------------------------------------------------------------------------------

/*
A collection of tasks which aren't related to the "Generate static blog" concept. These aren't really relevant
to the tutorial so you should probably just ignore them.
*/


// CONFIGURE PATHS
//--------------------------------------------------------------------------------------------------------------------------------------

/*
Here you can configure the paths used by Gulp to align with your project's directory structure.
*/

// Development root
const dev = "dev";

// Distribution root
const dist = "dist";

// HTML directories
const htmlDev = "dev/templates";
const htmlDist = dist;

// Image directories
const imgDev = "dev/img";
const imgDist = "dist/img";

// SASS directories
const sassDev = "dev/sass";
const sassDist = "dist/css";

// JS directories
const jsDev = "dev/js";
const jsDist = "dist/js";


// SERVER TASK
//--------------------------------------------------------------------------------------------------------------------------------------

gulp.task('serve', function() {
	gulp.src('./dist/')
	.pipe(webserver({
		open: true
	}));
});


// DELETE DIST DIRECTORY
//--------------------------------------------------------------------------------------------------------------------------------------

// Delete any existing Dist directory so old files don't contaminate our new build

gulp.task('deleteDist', function(){
	return del(dist);
});


// SASS
//--------------------------------------------------------------------------------------------------------------------------------------

gulp.task('sass', function () {
	return gulp.src(sassDev + '/*.scss')
	.pipe(sassGlob())
	.pipe(sass({outputStyle: 'compressed', precision: 8}))
	.pipe(rename({ suffix: '.min' }))
	.on('error', sass.logError)
	.pipe(gulp.dest('./' + sassDist))
});


// COPY IMAGES
//--------------------------------------------------------------------------------------------------------------------------------------


gulp.task('images', function(){
	gulp.src(imgDev + '/**/*.+(png|jpg|gif|ico|svg)')
	.pipe(gulp.dest(imgDist));
});


//--------------------------------------------------------------------------------------------------------------------------------------
// PRODUCTION FUNCTIONS
//--------------------------------------------------------------------------------------------------------------------------------------

/*
Here we pull everything together into generic watch and build functions
*/

// WATCH FUNCTION
gulp.task("watch", function() {
	// HTML
	gulp.watch(htmlDev + '/**/*.html',['generate-blog']);
	// SASS
	gulp.watch(sassDev + '/**/*.scss',['sass']);
});

// BUILD FUNCTION
gulp.task('build',function() {
	runSequence(
		// Delete Dist Folder
		"deleteDist",	
		// Run other tasks asynchronously 
		["sass", "images"]
	);
});