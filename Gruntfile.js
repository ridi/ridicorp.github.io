module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            main: {
                src: 'js/<%= pkg.name %>.js',
                dest: 'js/<%= pkg.name %>.min.js'
            }
        },
        less: {
            expanded: {
                options: {
                    paths: ["css"]
                },
                files: {
                    "css/<%= pkg.name %>.css": "less/<%= pkg.name %>.less"
                }
            },
            minified: {
                options: {
                    paths: ["css"],
                    cleancss: true
                },
                files: {
                    "css/<%= pkg.name %>.min.css": "less/<%= pkg.name %>.less"
                }
            }
        },
        banner: '/*!\n' +
            ' * <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n' +
            ' * Copyright <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
            ' * Licensed under <%= pkg.license.type %> (<%= pkg.license.url %>)\n' +
            ' */\n',
        usebanner: {
            dist: {
                options: {
                    position: 'top',
                    banner: '<%= banner %>'
                },
                files: {
                    src: ['css/<%= pkg.name %>.css', 'css/<%= pkg.name %>.min.css', 'js/<%= pkg.name %>.min.js']
                }
            }
        },
        watch: {
            scripts: {
                files: ['js/<%= pkg.name %>.js'],
                tasks: ['uglify'],
                options: {
                    spawn: false,
                },
            },
            less: {
                files: ['less/*.less'],
                tasks: ['less'],
                options: {
                    spawn: false,
                }
            },
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
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-banner');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-webfont');


    // Default task(s).
    grunt.registerTask('default', ['uglify', 'less', 'usebanner', 'webfont']);

};
