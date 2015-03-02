'use strict';

module.exports = function(grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);


  // Configuration
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    name: '<%= pkg.name %>',
    version: '<%= pkg.version %>',


    mainFile: 'server-error.js',
    distFile: 'server-error.js',

    srcDir: 'src',
    srcFiles: '**/*.js',
    src: '<%= srcDir %>/<%= srcFiles %>',

    destDir: 'dist',

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      src: {
        src: [
          '<%= src %>',
          '!<%= srcDir %>/lib/**'
        ]
      },
      test: {
        src: ['test/*.js']
      }
    },


    jsdoc: {
      dist: {
        src: ['<%= src %>', 'README.md'],
        options: {
          destination: 'doc',
          template: 'node_modules/grunt-jsdoc/node_modules/ink-docstrap/template',
          configure: 'jsdoc-conf.json'
        }
      }
    },



    clean: {
      dist: {
        src: ['.tmp', '<%= destDir %>']
      }
    },

    // Capture the git commit for reporting
    'git-describe': {
      me: {}
    },

    uglify: {
      minify: {
        options: {
          preserveComments: 'some'
        },
        files: [
          {
            expand: true,
            cwd: '<%= destDir %>/',
            src: '<%= srcFiles %>',
            dest: '<%= destDir %>/',
            ext: '.min.js'
          }
        ]
      }
    },

    concat: {
      options: {
        separator: ';\r\n'
      },
      target: {
        dest: '<%= destDir %>/<%= distFile %>',
        src: [
          '<%= srcDir %>/banner.js',
          '.tmp/version.js',
          '.tmp/<%= distFile %>'
        ]
      }
    },

    umd: { // TODO: this UMD building is broken at the moment
      dist: {
        src: '<%= srcDir %>/<%= mainFile %>',
        dest: '.tmp/<%= distFile %>',
        template: '<%= srcDir %>/templates/noUmd.hbs',
        objectToExport: 'module.exports',
        globalAlias: 'zvmzioServerError',
        indent: '    ',
        deps: {
          'default': ['angular'],
          global: {
            items: ['angular'],
            prefix: 'root.'
          }
        }
      }
    },



    push: {
      options: {
        files: ['package.json', 'bower.json'],
        commitMessage: 'Release version %VERSION%',
        commitFiles: ['-a'],
        tagName: '%VERSION%',
        tagMessage: 'Version %VERSION%'
      }
    },


    // Test settings
    karma: {
      options: {
        configFile: 'test/karma.conf.js',
        singleRun: true
      },
      unit: {
        browsers: ['Chrome']
      },
      mac: {
        browsers: ['Chrome', 'Firefox', 'Safari']
      },
      windows: {
        browsers: ['Chrome', 'Firefox', 'IE']
      }
    }

  });

  grunt.registerTask('version', 'Tag the current build revision', function () {
    grunt.event.once('git-describe', function (rev) {
      grunt.file.write('.tmp/version.js',
        '// {revision:"' + rev.object + '",version:"' + grunt.config.get('version') + '"};'
      );
    });
    grunt.task.run('git-describe');
  });

  // Tasks

  grunt.registerTask('build', ['clean', 'version', 'umd', 'concat', 'uglify']);

  grunt.registerTask('doc', ['jsdoc']);
  grunt.registerTask('test', ['karma:unit']);
  grunt.registerTask('default', ['jshint', 'build', 'test']);
  grunt.registerTask('all', ['default', 'build', 'doc']);

  grunt.registerTask('release', ['push']);
  grunt.registerTask('release-minor', ['push:minor']);
  grunt.registerTask('release-major', ['push:major']);


};
