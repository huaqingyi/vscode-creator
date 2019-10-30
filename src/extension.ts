// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { copy, mkdirs, readJSONSync, removeSync, copySync } from 'fs-extra';
import { join, dirname } from 'path';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { watch } from 'chokidar';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// // Use the console to output diagnostic information (console.log) and errors (console.error)
	// // This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "vscode-creator" is now active!');

	// // The command has been defined in the package.json file
	// // Now provide the implementation of the command with registerCommand
	// // The commandId parameter must match the command field in package.json
	// let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
	// 	// The code you place here will be executed every time your command is executed

	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage('Hello World!');
	// });

	// context.subscriptions.push(disposable);

	const path = join(__dirname, '.cache');

	const creatorTemplate = vscode.commands.registerCommand('extension.creatorTemplate', () => {
		vscode.window.showOpenDialog({ // 可选对象
			canSelectFiles: false, // 是否可选文件
			canSelectFolders: true, // 是否可选文件夹
			canSelectMany: false, // 是否可以选择多个
			defaultUri: vscode.Uri.file('~'), // 默认打开本地路径
			openLabel: '请选择模板 ...'
		}).then(async (msg) => {
			if (!msg) { return; }
			let config: any = {};
			try {
				config = await readJSONSync(join(msg[0].path, 'config.json'));
			} catch (err) {
				await vscode.window.showInformationMessage('未找到配置文件 ...');
			}
			if (!config.name) { return; }
			await mkdirs(join(path, config.name));
			const res = await vscode.window.showInformationMessage('初始化完成 ...', '写入', '放弃');
			if (res === '写入') {
				await copy(msg[0].path, join(path, config.name));
				await vscode.window.showInformationMessage('生成成功 ...');
			}
		});
	});

	context.subscriptions.push(creatorTemplate);

	const delTemplate = vscode.commands.registerCommand('extension.delTemplate', async () => {
		const dirs = await readdirSync(path);
		const ds: string[] | undefined = await vscode.window.showQuickPick(dirs, {
			canPickMany: true,
			ignoreFocusOut: true,
			matchOnDescription: true,
			matchOnDetail: true,
			placeHolder: '温馨提示，请选择缓存模板？'
		});
		if (ds === undefined) { return; }
		await Promise.all(ds.map(async item => {
			return removeSync(join(path, item));
		}));
		await vscode.window.showInformationMessage('删除成功 ...');
	});

	context.subscriptions.push(delTemplate);

	const createTemplate = vscode.commands.registerCommand('extension.createTemplate', async (uri) => {
		console.log(uri);
		const dirs = await readdirSync(path);
		if (dirs.length === 0) { return await vscode.window.showInformationMessage('请先创建模块模板 ...'); }

		const ds: string | undefined = await vscode.window.showQuickPick(dirs, {
			canPickMany: false,
			ignoreFocusOut: true,
			matchOnDescription: true,
			matchOnDetail: true,
			placeHolder: '温馨提示，请选择缓存模板？'
		});
		if (ds === undefined) { return; }
		const res = await vscode.window.showInputBox({ // 这个对象中所有参数都是可选参数
			password: false, // 输入内容是否是密码
			ignoreFocusOut: true, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
			placeHolder: '生成模块名: ', // 在输入框内的提示信息
			prompt: '生成模块名, 与功能 Component 相同 .', // 在输入框下方的提示信息
		});
		if (!res) { return await vscode.window.showInformationMessage('请给模板命名 ...'); }
		// await copySync(join(path, res), uri.path);
		const watcher = watch(join(path, ds));
		console.log(join(path, ds));
		watcher.on('add', async path => {
			console.log(path);
			const data = readFileSync(path, 'utf-8');
			const filename = path.replace('$__ModuleName__$', res);
			await writeFileSync(filename, data.split('$__ModuleName__$').join(res));
			await copySync(filename, dirname(path));
			await removeSync(filename);
		});
		watcher.on('ready', () => {
			watcher.close();
			vscode.window.showInformationMessage('生成完毕 ...');
		});
	});

	context.subscriptions.push(createTemplate);
}

// this method is called when your extension is deactivated
export function deactivate() { }
