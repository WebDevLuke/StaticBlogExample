//--------------------------------------------------------------------------------------------------------------------------------------
// GULP OPTIONS
//--------------------------------------------------------------------------------------------------------------------------------------

/*
Tweak various options to suit the needs of your project
*/

//--------------------------------------------------------------------------------------------------------------------------------------
// SET DEPENDENCIES
//--------------------------------------------------------------------------------------------------------------------------------------

// Required for all tasks
const gulp = require('gulp');
// Required for SASS tags
const sass = require('gulp-sass');
// Used to lint SASS
const gulpStylelint = require('gulp-stylelint');
// Adds support for SASS globbing
const sassGlob = require('gulp-sass-glob');
// Used to rename CSS and JS depending if minified
const rename = require("gulp-rename");
// Used to add conditional functionality
const gulpif = require('gulp-if');
// Used to remove unused CSS styles post compile
const uncss = require('gulp-uncss');
// Used to create synchronous build tasks
const runSequence = require('run-sequence');
// Used to delete folders during build process
const del = require('del');
// Used to compile nunjacks templates if present
const nunjucks = require('nunjucks');
const markdown = require('nunjucks-markdown');
const marked = require('marked');
const gulpNunjucks = require('gulp-nunjucks');
// Used to make directories
const mkdirp = require('mkdirp');
// Used to make local dev server
var webserver = require('gulp-webserver');


//--------------------------------------------------------------------------------------------------------------------------------------
// BLOG FUNCTIONS
//--------------------------------------------------------------------------------------------------------------------------------------

/*
Gulp functions to generate static blog pages
*/


// CONFIGURE MARKDOWN
//--------------------------------------------------------------------------------------------------------------------------------------

// Setup new nunjucks with "dev" folder as root
var env = new nunjucks.Environment(new nunjucks.FileSystemLoader("dev"));

// Grab config object
var config = require("./dev/config.json");

// Set marked options
marked.setOptions({
	renderer: new marked.Renderer(),
	gfm: true,
	tables: true,
	breaks: false,
	pedantic: false,
	sanitize: false,
});

// Register marked with nunjucks
markdown.register(env, marked);


// CATEGORY INFO
//--------------------------------------------------------------------------------------------------------------------------------------

// Generate our categories object
var categoryList = new Array;
var categories = new Array;
// Create list of categories
for(let post of config.posts) {
	if(categoryList.indexOf(post.category) === -1) {
		categoryList.push(post.category);
	}
}


// Populate category object
// This holds each category name + a list of all child posts
for(let category of categoryList) {
	// Create category object
	let categoryObj = new Object;
	// Populate name
	categoryObj.name = category;
	// Create empty array to hold category posts
	categoryObj.posts = new Array;
	// Populate category posts
	for(let post of config.posts) {
		// If we have any matches
		if(categoryObj.name === post.category) {
			categoryObj.posts.push(post);
		}
	}
	// Push to global categories object
	categories.push(categoryObj);
}


// TAGS INFO
//--------------------------------------------------------------------------------------------------------------------------------------

// Generate list of tags from posts
var tagsList = new Array;
var tags = new Array;

// Create list of tags
for(let post of config.posts) {
	for(let tag of post.tags) {
		if(tagsList.indexOf(tag) === -1) {
			tagsList.push(tag);
		}
	}
}

// Populate tags object
// This holds each tag name + a list of all child posts
for(let tag of tagsList) {
	// Create tag object
	let tagObj = new Object;
	// Populate name
	tagObj.name = tag
	// Create empty array to hold tag posts
	tagObj.posts = new Array;
	// Populate tag posts
	for(let post of config.posts) {
		// If we have any matches
		for(let tag of post.tags) {
			if(tag.name === tag) {
				tagObj.posts.push(post);
			}
		}
	}
	// Push to global tags object
	tags.push(tagObj);
}


// AUTHORS INFO
//--------------------------------------------------------------------------------------------------------------------------------------

// Generate our authors object
var authorsList = new Array;
var authors = new Array;
// Create list of authors
for(let post of config.posts) {
	if(authorsList.indexOf(post.author) === -1) {
		authorsList.push(post.author);
	}
}
// Populate authors object
// This holds each author name + a list of all child posts
for(let author of authorsList) {
	// Create authors object
	var authorObj = new Object;
	// Populate name
	authorObj.name = author;
	// Create empty array to hold author posts
	authorObj.posts = new Array;
	// Populate author posts
	for(let post of config.posts) {
		// If we have any matches
		if(author.name === post.author) {
			authorObj.posts.push(post);
		}
	}
	// Push to global authors object
	authors.push(authorObj);
}


// RENDER FUNCTIONS
//--------------------------------------------------------------------------------------------------------------------------------------

// Define function to render article pages
var renderPages = function(posts, destDir, filter) {
	// Calculate number of required pages
	let pageNum = Math.ceil(posts.length / config.postsPerPage);
	// Duplicate articles so we can remove stuff without affecting global list
	let postsLocal = posts.slice();
	// Set up int for while loop. This will help with pagination naming.
	// Start at 1, as in page 1
	let k = 1;
	// Set up variable to determine if we should name a page index.html
	let indexToCome = true;

	// While loop
	while(postsLocal.length){
		// If we have a block of postsPerPage add that
		if(postsLocal.length >= config.postsPerPage) {
			var postsToAdd = postsLocal.splice(0, config.postsPerPage);
		}
		// If no more blocks of postsPerPage remain, just add what's left
		else {
			var postsToAdd = postsLocal;
			postsLocal = [];
		}
		// Process list of articles
		gulp.src('./dev/templates/blog-index.html')
		.pipe(gulpNunjucks.compile({
			config: config,
			categories: categoryList,
			tags: tagsList,
			authors: authorsList,
			posts: postsToAdd,
			currentPage: k,
			pageNum: pageNum,
			filter: filter
		}, {env: env}))
		.pipe(gulpif(indexToCome, rename("index.html"), rename(k + ".html")))
		.pipe(gulp.dest(destDir));
		// Increment pagination int
		k++;
		// Mark that index has been generated
		indexToCome = false;
	}
}

// Generate articles page, pagination for all articles, categorys, tags and authors
gulp.task('blog-index', function() {
	// Render normal blog pages
	renderPages(config.posts, "dist/");
	console.log("Generated Post listings pages");
	// Render category pages
	for(let category of categories) {
		// Generate empty filter 
		var filter = new Object;
		filter.name = category.name;
		filter.type = "category";
		// Render pages
		renderPages(category.posts, "dist/category/" + category.name.replace(/ /g, '-').toLowerCase(), filter);
		console.log("Generated " +  category.name + " category pages");
	}
	// Render tag pages
	for(let tag of tags) {
		// Generate empty filter 
		var filter = new Object;
		filter.name = tag.name;
		filter.type = "tag";
		// Render pages
		renderPages(tag.posts, "dist/tag/" + tag.name.replace(/ /g, '-').toLowerCase(), filter);
		console.log("Generated " +  tag.name + " tag pages");
	}
	// Render author pages
	for(let author of authors) {
		// Generate empty filter 
		var filter = new Object;
		filter.name = author.name;
		filter.type = "author";
		// Render pages
		renderPages(author.posts, "dist/author/" + author.name.replace(/ /g, '-').toLowerCase(), filter);
		console.log("Generated " +  author.name + " author pages");
	}
});

// Generate individual blog posts
gulp.task('blog-posts', function() {
	for(let post of config.posts) {
		console.log("Generated " + post.title);
		gulp.src('./dev/templates/blog-post.html')
		.pipe(gulpNunjucks.compile({
			config: config,
			categories: categoryList,
			tags: tagsList,
			authors: authorsList,
			post: post
		}, {env: env}))
		.pipe(rename(post.title.replace(/ /g, '-').toLowerCase() + ".html"))
		.pipe(gulp.dest("./dist/"));
	}
});

gulp.task('generate-blog', function(){
	runSequence(
		"blog-index",
		"blog-posts"
	);
});
























//--------------------------------------------------------------------------------------------------------------------------------------
// SECONDARY GULP TASKS
//--------------------------------------------------------------------------------------------------------------------------------------

/*
A collection of tasks which aren't related to the "Generate static blog" concept. These aren't really relevant
to static blogs so you should probably just ignore them.
*/

// MINIFY
//--------------------------------------------------------------------------------------------------------------------------------------

/*
If minify is true then CSS & JS will be minified once compiled and will have a .min suffix before the file
extension. For example 'style.min.css'.
*/

const minify = true;


// SASS LINTING
//--------------------------------------------------------------------------------------------------------------------------------------

/*
If lint is true then SASS will be linted by stylelint to enforce style guidelines. These rules can be tweaked 
in '.stylelintrc'.
*/

const lint = false;


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

// SETUP TASK
//--------------------------------------------------------------------------------------------------------------------------------------

/*
Task which you run on project start to setup SASS directory and copy required files from OrionCSS dependancy

Creates SASS directory in dev directory and adds the following:-

- Creates ITCSS directory structure
- sample.main-orion-framework renamed to main and copied to SASS root
- sample.component.mycomponent added to "06 - components" directory
*/

const folders = [
	sassDev + "/01 - settings",
	sassDev + "/02 - tools",
	sassDev + "/03 - generic",
	sassDev + "/04 - elements",
	sassDev + "/05 - objects",
	sassDev + "/06 - components",
	sassDev + "/07 - utilities",
	jsDev
]

gulp.task('setup', function(){
	// Generate directories
	for(var i = 0; i < folders.length; i++) {
		mkdirp(folders[i], function (err) {
			if(err){
				console.error(err);
			}
		});
	}
	// Grab main sample and move to SASS root
	gulp.src('node_modules/orioncss/sample.main-orion-framework.scss')
	.pipe(rename('main.scss'))
	.pipe(gulp.dest(sassDev))
	// Grab sample component and move to new components dir
	gulp.src('node_modules/orioncss/06 - components/_sample.component.mycomponent.scss')
	.pipe(gulp.dest(sassDev + '/06 - components/'));
	// Gram sample JS main, rename and then 
	gulp.src('node_modules/orionjs/sample.main.js')
	.pipe(rename('main.js'))
	.pipe(gulp.dest(jsDev))
});

// Developer task to clear content added by setup task so we don't accidently commit it.
gulp.task('unsetup', function(){
	del(sassDev);
	del(jsDev);
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
	.pipe(gulpif(minify, sass({outputStyle: 'compressed', precision: 8}), sass({outputStyle: 'expanded', precision: 8})))
	.pipe(gulpif(minify, rename({ suffix: '.min' })))
	.on('error', sass.logError)
	.pipe(gulp.dest('./' + sassDist))
});

// A SASS task for debug use. Compiles an unminified stylesheet but uses canon naming structure as
// per minify variable so no links are broken on the page
gulp.task('sass-debug', function () {
	return gulp.src(sassDev + '/*.scss')
	.pipe(sassGlob())
	.pipe(sass({outputStyle: 'expanded', precision: 8}))
	.pipe(gulpif(minify, rename({ suffix: '.min' })))
	.on('error', sass.logError)
	.pipe(gulp.dest('./' + sassDist))
});


// Lint SASS Task
gulp.task('sass-lint', function lintCssTask() {
	return gulp.src(sassDev + '/**/*.scss')
	.pipe(gulpStylelint({
		reportOutputDir: 'reports/lint',
		reporters: [{
			formatter: 'verbose',
			console: true,
			save: 'report.txt'
		}]
	}));
});

// Watch task for SASS. Lints and then runs standard SASS functions. No UNCSS to speed things up..
gulp.task('sass-watch', function(){
	if(lint) {
		runSequence(
			"sass-lint",
			"sass"
		);
	}
	else {
		runSequence(
			"sass"
		);		
	}
});

// Create seperate sass build task which lints and then runs standard SASS functions followed by UNCSS
// This will be used on Build task. It won't be used on watch task to speed things up.
gulp.task('sass-build', function(){
	if(lint) {
		runSequence(
			"sass-lint",
			"sass"
		);
	}
	else {
		runSequence(
			"sass"
		);		
	}
});

gulp.task('sass-build-debug', function(){
	if(lint) {
		runSequence(
			"sass-lint",
			"sass-debug"
		);
	}
	else {
		runSequence(
			"sass"
		);		
	}
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
	gulp.watch(sassDev + '/**/*.scss',['sass-watch']);
});

// BUILD FUNCTION
gulp.task('build',function() {
	runSequence(
		// Delete Dist Folder
		"deleteDist",	
		// Run other tasks asynchronously 
		["generate-blog", "sass-build", "images"]
	);
});