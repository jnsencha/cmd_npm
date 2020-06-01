const pkg = require('./package.json');
const platform = {"darwin": "macos", "win32": "windows", "win64": "windows", "linux": "linux" }[process.platform] || process.platform;
const arch = process.arch || (process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432') ? "x64" : "x32");
const which = require('which');
const path = require('path');
let javaFound = false;

let getPackageName = () => {
    let name = `${pkg.name}-${platform}`;
    if (!javaFound) {
        if (platform === "windows") {
            name += `-${arch === "x64" ? "64" : "32"}`;
        }
        name += `-jre`;
    } else {
        if (platform === "linux") {
            name += `-${arch === "x64" ? "64" : "32" }`;
        }
    }
    return name;
}

let validate = () => {
    if (!javaFound && platform === "linux") {
        console.error('A JRE is required to download and run Sencha Cmd in linux.');
        process.exit(126);
    }
}

let proceedWithInstall = () => {
    let pkgName = getPackageName();
    let loglevel = ["silent", "error", "warn", "http", "info", "verbose", "silly"].indexOf(process.env.npm_config_loglevel);
    let args = [
        'install',
        `${pkgName}@${pkg.version}`
    ];
    if (loglevel > -1) {
        args.push('--loglevel');
        args.push(process.env.npm_config_loglevel);
    }
    validate();
    console.log('\x1b[32m\x1b[1m[INF]\x1b[0m', 'Installing Sencha Cmd...');
    let npmInstall = require('child_process').spawn(`npm${/^win/.test(require('os').platform()) ? ".cmd" : ""}`, args, {
        cwd: path.join(__dirname)
    });
    npmInstall.on('close', (code) => {
        console.log(`> [platform-installer]: Exited with code ${code}`);
        if (code===0) {
            require(`${pkgName}/install.js`)(__dirname);
        }
    });
    npmInstall.on('error', (error) => {
        console.error(`> [platform-installer][stderr]: ${error.message ? error.message : error}`);
    });
    npmInstall.stderr.on('data', (stderr) => {
        console.error(`> [platform-installer][stderr]: ${stderr}`);
    });
    if (loglevel > 3) {
        npmInstall.stdout.on('data', (stdout) => {
            console.log(`> [platform-installer]: ${stdout}`);
        });
    }
}

try {
    which('java', (err, path) => {
        javaFound = !err && path;
        proceedWithInstall();
    });
} catch (ex) {
    console.error(`> [platform-installer][stderr]: ${ex.message ? ex.message : ex}`);
    proceedWithInstall();
}

