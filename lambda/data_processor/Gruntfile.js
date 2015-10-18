module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    lambda_invoke: {
        default: {
            options: {
            }
        }
    },
    lambda_deploy: {
      default: {
        arn: 'arn:aws:lambda:us-east-1:465070256155:function:tesla_data_processing',
        options: {
          profile: 'lambda_deployer',
          timeout: 60
        }
      }
    },
    lambda_package: {
      default: {
      }
    }
  });

  // Load the plugin that provides the "lambda" tasks.
  grunt.loadNpmTasks('grunt-aws-lambda');

  // Default task(s).
  grunt.registerTask('default', ['lambda_package','lambda_deploy']);

};