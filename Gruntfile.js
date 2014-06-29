'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to match all subfolders:
// 'test/spec/**/*.js'

var project = {
  app: 'app',
  dist: 'dist'
};

module.exports = function (grunt) {
  require('time-grunt')(grunt);
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    project: project,

    watch: {
      neuter: {
        files: ['<%= project.app %>/scripts/**/*.js'],
        tasks: ['neuter']
      },
      recess: {
        files: ['<%= project.app %>/styles/{,*/}*.less'],
        tasks: ['recess:dist']
      },
      gruntfile: {
        files: ['Gruntfile.js']
      }
    },

    connect: {
      options: {
        port: 9000,
        hostname: 'localhost'
      },
      dev: {
        options: {
          base:  ['.tmp', '<%= project.app %>']
        }
      },
      test: {
        options: {
          port: 9001,
          base: [
            '.tmp',
            'test',
            '<%= project.app %>'
          ]
        }
      },
      dist: {
        options: {
          base: '<%= project.dist %>'
        }
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },

      all: [
        'Gruntfile.js',
        '<%= project.app %>/scripts/**/*.js'
      ]
    },

    recess: {
      options: {
        compile: true,
        compress: true
      },

      dist: {
        files: [{
          expand: true,
          cwd: '<%= project.app %>/styles',
          src: '{,*/}*.less',
          dest: '.tmp/styles/',
          ext: '.css'
        }]
      }
    },

    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= project.dist %>/*',
            '!<%= project.dist %>/.git*'
          ]
        }]
      },
      server: '.tmp'
    },

//    mocha: {
//      all: {
//        options: {
//          run: true,
//          urls: ['http://localhost:<%= connect.options.port %>/index.html']
//        }
//      }
//    },

    wiredep: {
      target: {
        src: ['<%= project.app %>/index.html']
      }
    },

    rev: {
      dist: {
        files: {
          src: [
            '<%= project.dist %>/scripts/**/*.js',
            '<%= project.dist %>/styles/{,*/}*.css',
            '<%= project.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp}',
            '<%= project.dist %>/styles/fonts/*'
          ]
        }
      }
    },

    useminPrepare: {
      html: '<%= project.app %>/{,partials/}{,*/}*.html',
      options: {
        dest: '<%= project.dist %>'
      }
    },

    usemin: {
      html: ['<%= project.dist %>/{,partials/}{,*/}*.html'],
      css: ['<%= project.dist %>/styles/{,*/}*.css'],
      options: {
        dirs: ['<%= project.dist %>']
      }
    },

    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= project.app %>/images',
          src: '{,*/}*.{png,jpg,jpeg}',
          dest: '<%= project.dist %>/images'
        }]
      }
    },

    svgmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= project.app %>/images',
          src: '{,*/}*.svg',
          dest: '<%= project.dist %>/images'
        }]
      }
    },

    cssmin: {
      dist: {
        files: {
          '<%= project.dist %>/styles/main.css': [
            '.tmp/styles/{,*/}*.css',
            '<%= project.app %>/styles/{,*/}*.css'
          ]
        }
      }
    },

    htmlmin: {
      dist: {
        options: {
          // https://github.com/yeoman/grunt-usemin/issues/44 */
          collapseWhitespace: true,
          collapseBooleanAttributes: true,
          removeCommentsFromCDATA: true,
          removeOptionalTags: true
        },

        files: [{
          expand: true,
          cwd: '<%= project.dist %>',
          src: ['*.html', 'partials/{,*/}*.html'],
          dest: '<%= project.dist %>'
        }]
      }
    },

    neuter: {
      app: {
        options: {
          filepathTransform: function (filepath) {
            return project.app + '/' + filepath;
          }
        },
        src: '<%= project.app %>/scripts/app.js',
        dest: '.tmp/scripts/combined-scripts.js'
      }
    },

    // Put files not handled in other tasks here
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= project.app %>',
          dest: '<%= project.dist %>',
          src: [
            '*.{ico,png,txt}',
            '.htaccess',
            '*.html',
            'partials/{,*/}*.html',
            'images/{,*/}*.{webp}',
            'fonts/*'
          ]
        }, {
          expand: true,
          cwd: 'app/bower_components/bootstrap/',
          dest: '<%= project.dist %>',
          src: 'fonts/*'
        }]
      }
    },
    //

    concurrent: {
      dist: [
        'imagemin',
        'svgmin'
      ]
    }
  });

  grunt.registerTask('serve', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'connect:dist:keepalive']);
    }

    // less
    grunt.task.run([
      'clean:server',
      'recess:dist',
      'neuter:app',
      'connect:dev',
      'watch'
    ]);
  });

  grunt.registerTask('test', [
    'clean:server',
    'wiredep',
    'connect:test',
    'neuter:app',
    'mocha'
  ]);

  grunt.registerTask('build', [
    'clean:dist',
    'wiredep',
    'recess:dist',
    'useminPrepare',
    'concurrent:dist',
    'neuter:app',
    'copy:dist',
    'concat',
    'cssmin',
    'uglify',
    'rev',
    'usemin',
    'htmlmin'
  ]);

  grunt.registerTask('default', [
    'jshint',
    'test',
    'build'
  ]);
};
