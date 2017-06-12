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
// Used to compile nunjacks templates if present
const nunjucks = require('nunjucks');
const markdown = require('nunjucks-markdown');
const marked = require('marked');
const gulpNunjucks = require('gulp-nunjucks');


// CONFIGURE MARKDOWN
//--------------------------------------------------------------------------------------------------------------------------------------

// Setup new nunjucks with "dev" folder as root
const env = new nunjucks.Environment(new nunjucks.FileSystemLoader("dev"));

// Grab config object
const config = require("./dev/config.json");

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
const categoryList = new Array;
const categories = new Array;

// Create list of categories
for(let post of config.posts) {
	if(!categoryList.includes(post.category)) {
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
const tagsList = new Array;
const tags = new Array;

// Create list of tags
for(let post of config.posts) {
	for(let tag of post.tags) {
		if(!tagsList.includes(tag)) {
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
			if(tagObj.name === tag) {
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
const authorsList = new Array;
const authors = new Array;

// Create list of authors
for(let post of config.posts) {
	if(!authorsList.includes(post.author)) {
		authorsList.push(post.author);
	}
}
// Populate authors object
// This holds each author name + a list of all child posts
for(let author of authorsList) {
	// Create authors object
	let authorObj = new Object;
	// Populate name
	authorObj.name = author;
	// Create empty array to hold author posts
	authorObj.posts = new Array;
	// Populate author posts
	for(let post of config.posts) {
		// If we have any matches
		if(authorObj.name === post.author) {
			authorObj.posts.push(post);
		}
	}
	// Push to global authors object
	authors.push(authorObj);
}


// RENDER FUNCTIONS
//--------------------------------------------------------------------------------------------------------------------------------------

// Define function to render article pages
const renderPages = function(posts, destDir, filter) {
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
		let postsToAdd;
		if(postsLocal.length >= config.postsPerPage) {
			postsToAdd = postsLocal.splice(0, config.postsPerPage);
		}
		// If no more blocks of postsPerPage remain, just add what's left
		else {
			postsToAdd = postsLocal;
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
		let filter = new Object;
		filter.name = category.name;
		filter.type = "category";
		// Render pages
		renderPages(category.posts, "dist/category/" + category.name.replace(/ /g, '-').toLowerCase(), filter);
		console.log("Generated " +  category.name + " category pages");
	}
	// Render tag pages
	for(let tag of tags) {
		// Generate empty filter 
		let filter = new Object;
		filter.name = tag.name;
		filter.type = "tag";
		// Render pages
		renderPages(tag.posts, "dist/tag/" + tag.name.replace(/ /g, '-').toLowerCase(), filter);
		console.log("Generated " +  tag.name + " tag pages");
	}
	// Render author pages
	for(let author of authors) {
		// Generate empty filter 
		let filter = new Object;
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
		["generate-blog", "sass", "images"]
	);
});