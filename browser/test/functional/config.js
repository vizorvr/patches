exports.config = {

    /**
     * language of your feature files
     * options: french, spanish, norwegian, polish, german, russian
     */
    language: 'english',

    /**
     * set selenium host and port
     */
    selenium: {
        host: '127.0.0.1',
        port: 4444
    },

    /**
     * webdriverio options
     *
     * - logLevel: stdout log level
     *   Options: *verbose* | *silent* | *command* | *data* | *result*
     *
     * - coloredLogs: Enables colors for log output
     *   default: true
     *
     * - singleton: Set to true if you always want to reuse the same remote
     *   default: false
     *
     * - waitforTimeout: Default timeout for all waitForXXX commands
     *   default: 500
     */
    options: {
        logLevel: 'silent',
        waitforTimeout: 45000
    },

    /**
     * desired capabilities
     */
    capabilities: {
        browserName: 'chrome',
        chromeOptions: {
            args: ['--ignore-gpu-blacklist', '--use-gl']
        }
    },

    /**
     * location of feature files
     */
    featureFiles: [
        'functional/features/**/*.feature'
    ],

    /**
     * environment variables
     *
     * - baseUrl: sets base url for `Given I open the site "/some/url.html"`
     */
    env: {
        baseUrl: 'http://127.0.0.1:8000'
    },

    /**
     * mocha options
     * @see http://mochajs.org/
     */
    mochaOpts: {
        reporter: 'spec',
        timeout: 60000,
        require: 'chai'
    }
};
