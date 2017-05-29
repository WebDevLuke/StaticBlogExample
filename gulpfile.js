//--------------------------------------------------------------------------------------------------------------------------------------
// GULP OPTIONS
//--------------------------------------------------------------------------------------------------------------------------------------

/*
Tweak various options to suit the needs of your project
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
for(var i = 0; i < config.posts.length; i++) {
	if(categoryList.indexOf(config.posts[i].category) === -1) {
		categoryList.push(config.posts[i].category);
	}
}
// Construct category object
for(var i = 0; i < categoryList.length; i++) {
	// Create category object
	var category = new Object;
	// Populate name
	category.name = categoryList[i];
	// Create empty array to hold category posts
	category.posts = new Array;
	// Populate category posts
	for(var h = 0; h < config.posts.length; h++) {
		// If we have any matches
		if(category.name === config.posts[h].category) {
			category.posts.push(config.posts[h]);
		}
	}
	// Push to global categories object
	categories.push(category);
}


// TAGS INFO
//--------------------------------------------------------------------------------------------------------------------------------------

// Generate list of tags from posts
var tagsList = new Array;
var tags = new Array;
// Create list of tags
for(var i = 0; i < config.posts.length; i++) {
	for(var h = 0; h < config.posts[i].tags.length; h++) {
		if(tagsList.indexOf(config.posts[i].tags[h]) === -1) {
			tagsList.push(config.posts[i].tags[h]);
		}
	}
}
// Construct tags object
for(var i = 0; i < tagsList.length; i++) {
	// Create category object
	var tag = new Object;
	// Populate name
	tag.name = tagsList[i];
	// Create empty array to hold category posts
	tag.posts = new Array;
	// Populate category posts
	for(var h = 0; h < config.posts.length; h++) {
		// If we have any matches
		for(var m = 0; m < config.posts[h].tags.length; m++) {
			if(tag.name === config.posts[h].tags[m]) {
				tag.posts.push(config.posts[h]);
			}
		}
	}
	// Push to global categories object
	tags.push(tag);
}


// AUTHORS INFO
//--------------------------------------------------------------------------------------------------------------------------------------

// Generate our authors object
var authorsList = new Array;
var authors = new Array;
// Create list of authors
for(var i = 0; i < config.posts.length; i++) {
	if(authorsList.indexOf(config.posts[i].author) === -1) {
		authorsList.push(config.posts[i].author);
	}
}
// Construct authors object
for(var i = 0; i < authorsList.length; i++) {
	// Create authors object
	var author = new Object;
	// Populate name
	author.name = authorsList[i];
	// Create empty array to hold author posts
	author.posts = new Array;
	// Populate author posts
	for(var h = 0; h < config.posts.length; h++) {
		// If we have any matches
		if(author.name === config.posts[h].author) {
			author.posts.push(config.posts[h]);
		}
	}
	// Push to global author object
	authors.push(author);
}


// RENDER FUNCTIONS
//--------------------------------------------------------------------------------------------------------------------------------------

// Define function to render article pages
var renderPages = function(posts, destDir) {
	// Calculate number of required pages
	var pageNum = Math.ceil(posts.length / config.postsPerPage);
	// Duplicate articles so we can remove stuff without affecting global list
	var postsLocal = posts.slice();
	// Set up loop for while loop
	// Start at 1
	var k = 1;
	// Set up variable to determine if we should name a page index.html
	var indexToCome = true;

	// While loop
	while(postsLocal.length){
		// If we have a block of 3 add that
		if(postsLocal.length >= config.postsPerPage) {
			var postsToAdd = postsLocal.splice(0, config.postsPerPage);
		}
		// If no more blocks of 3 remain, just add what's left
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
			pageNum: pageNum
		}, {env: env}))
		.pipe(gulpif(indexToCome, rename("index.html"), rename(k + ".html")))
		.pipe(gulp.dest(destDir));
		// Incrememt while int
		k++;
		// Flag that index has been processed
		indexToCome = false;
	}
}

// Generate articles page, pagination for all articles, categorys, tags and authors
gulp.task('blog-index', function() {
	// Render normal blog pages
	renderPages(config.posts, "dist/posts/");
	// Render category pages
	for(var i = 0; i < categories.length; i++) {
		renderPages(categories[i].posts, "dist/category/" + categories[i].name.replace(/ /g, '-').toLowerCase());
	}
	// Render tag pages
	for(var i = 0; i < tags.length; i++) {
		renderPages(tags[i].posts, "dist/tag/" + tags[i].name.replace(/ /g, '-').toLowerCase());
	}
	// Render author pages
	for(var i = 0; i < authors.length; i++) {
		renderPages(authors[i].posts, "dist/author/" + authors[i].name.replace(/ /g, '-').toLowerCase());
	}
});

// Generate individual blog posts
gulp.task('blog-posts', function() {
	for(var i = 0; i < config.posts.length; i++) {
		console.log("Generated " + config.posts[i].title);
		var post = config.posts[i];
		var slug = config.posts[i].title.replace(/ /g, '-').toLowerCase();
		gulp.src('./dev/templates/blog-post.html')
		.pipe(gulpNunjucks.compile({
			config: config,
			categories: categoryList,
			tags: tagsList,
			authors: authorsList,
			post: post
		}, {env: env}))
		.pipe(rename(slug + ".html"))
		.pipe(gulp.dest("./dist/posts/"));
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
A collection of tasks which aren't related to the "Generate static blog" concept. These are generally hacked
together so you should probably just ignore them.
*/

// SERVER TASK
//--------------------------------------------------------------------------------------------------------------------------------------

gulp.task('webserver', function() {
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