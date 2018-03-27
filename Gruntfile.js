module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    less: {
      build: {
        expand: true,
        flatten: true,
        cwd: 'assets/less',
        src: ['*.less',
          '!mixins.less',
          '!icon.less',
          '!variables.less'
        ],
        dest: 'assets/css/',
        ext: '.css',
        extDot: 'last'
      }
    },
    watch: {
      scripts: {
        files: ['assets/js/<%= pkg.name %>.js'],
        tasks: ['uglify'],
        options: {
          spawn: false
        }
      },
      less: {
        files: ['assets/less/*.less'],
        tasks: ['less'],
        options: {
          spawn: false
        }
      }
    },
    webfont: {
      icons: {
        src: 'icon/svg/*.svg',
        dest: 'icon/fonts',
        destCss: 'icon/css',
        options: {
          normalize: true,
          font: 'ridicorp-icon',
          htmlDemo: true,
          htmlDemoTemplate: 'icon/templates/ridicorp_tmpl.html',
          destHtml: 'icon',
          // stylesheet: 'less',
          template: 'icon/templates/ridicorp_tmpl.css',
          types: 'eot,ttf,woff',
          embed: 'ttf,woff',
          fontHeight: 1024,
          descent: 64,
          templateOptions: {
            baseClass: 'ridicorp-icon',
            classPrefix: 'icon-',
            mixinPrefix: 'icon_'
          }
        }
      }
    }
  });

  // Load the plugins.
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-webfont');


  // Default task(s).
  grunt.registerTask('default', ['less', 'webfont']);

};
