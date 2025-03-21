import plugin from '../../lib/plugins/plugin.js';
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { exec } = require("child_process");
import fetch from "node-fetch";
import fs from 'fs'

let plugins_list_url = `https://github.yunzai.fun/https://raw.githubusercontent.com/QQ53199575/plugins-update/refs/heads/main/plugins.json`
let pluginsList_temp

/**
 * 作者：千奈千祁(2632139786)
 * Gitee主页：Gitee.com/QianNQQ
 * Github主页：Github.com/QianNQQ
 * 
 * 该插件所有版本发布于 该仓库(https://gitee.com/qiannqq/yunzai-plugin-JS)
 * 本插件及该仓库的所有插件均遵循 GPL3.0 开源协议
 * 
 * 请勿使用本插件进行盈利等商业活动行为
 */

export class example2 extends plugin {
    constructor () {
      super({
        name: '插件管理器',
        dsc: '插件管理器@千奈千祁',
        event: 'message',
        priority: -1,
        rule: [
          {
            reg: '^#插件(列表|市场|大全)$',
            fnc: '插件列表'
          },{
            reg: '^#安装插件(.*)$',
            fnc: '安装插件'
          },{
            reg: '^#代理安装插件(.*)$',
            fnc: '代理安装插件'
          },{
            reg: '^#(删除|卸载)插件(.*)$',
            fnc: '卸载插件'
          },{
            reg: '^#已安装插件(列表)?$',
            fnc: '已安装插件'
          },{
            reg: '^#搜索插件(.*)$',
            fnc: '搜索插件'
          }
        ]
      })
    }
    async getplugins() {
      let timestamp = Math.floor(Date.now() / 1000);
      if(!pluginsList_temp?.time || pluginsList_temp.time+3600 <= timestamp) {
        pluginsList_temp = await fetch(plugins_list_url)
        pluginsList_temp = await pluginsList_temp.json()
        pluginsList_temp.time = timestamp
      }
      return pluginsList_temp
    }
    async 搜索插件(e) {
      if(!e.isMaster) return false
      let commsg = e.msg.match(/^#搜索插件(.*)$/)
      if(!commsg) return false

      let plugins_list = await this.getplugins()

      let pluginList = []
      for (let item of plugins_list) {
        for (let item2 in item) {
          if (item[item2].includes(commsg[1])) {
            pluginList.push(item);
            break; // 仅退出内层循环
          }
        }
      }
      if(pluginList.length == 0) {
        await e.reply(`未搜索到插件！`)
        return true
      }
      let msgList = []
      msgList.push({
        user_id: Bot.uin,
        message: `搜索到${pluginList.length}个插件`,
        nickname: Bot.nickname
      })
      for(let item of pluginList) {
        let msgList_ = 
`插件名称:${item.pluginname}
作者:${item.author}
简介:${item.describe}
插件链接:${item.url}
安装指令:#安装插件${item.pathname}`
        msgList.push({
          user_id: Bot.uin,
          message: msgList_,
          nickname: Bot.nickname
        })
      }
      if(e.isGroup) e.reply(await e.group.makeForwardMsg(msgList))
        else e.reply(await e.friend.makeForwardMsg(msgList))
    }
    async 已安装插件(e) {
      if(!e.isMaster) return false
      let files
      try {
        files = fs.readdirSync(`./plugins`, { withFileTypes: true });
      } catch(err) {
        await e.reply(`获取PathName时出错！\n${err.message}`)
        return true
      }
      let directories = files.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
      let local_plugins_list = []
      for (let item of directories) {
        if(item !== `example` && item !== `genshin` && item !== `system` && item !== `other`) {
          local_plugins_list.push(item)
        }
      }
      let cloud_plugins_list = await this.getplugins()
      let local_plugins_list_msg = []
      for (let litem of local_plugins_list) {
        local_plugins_list_msg.push(await lplm(cloud_plugins_list, litem))
      }
      let msgList = []
      for (let item of local_plugins_list_msg) {
        let msgList_ = 
`插件名称:${item.pluginname}
作者:${item.author}
简介:${item.describe}
插件链接:${item.url}
卸载指令:#卸载插件${item.pathname}`
        msgList.push({
          user_id: Bot.uin,
          message: msgList_
        }) 
      }
      let msg;
      try {
        msg = await e.group.makeForwardMsg(msgList)
      } catch {
        msg = await e.friend.makeForwardMsg(msgList)
      }
      await e.reply(msg)
      return true
    }
    async 卸载插件(e) {
        if(!e.isMaster) return false
        let plugin_pathname = e.msg.match(/^#(删除|卸载)插件(.*)$/)[2]
        if(!plugin_pathname) {
          await e.reply(`要卸载的插件名为空！`)
          return true
        }
        if(!fs.existsSync(`./plugins/${plugin_pathname}`)) {
          await e.reply(`要卸载的插件不存在！`)
          return true
        }
        if(plugin_pathname == `miao-plugin` || plugin_pathname == `genshin` || plugin_pathname == `system` || plugin_pathname == `example` || plugin_pathname == `other`) {
          await e.reply(`系统组件不支持卸载`)
          return true
        }
        try {
          fs.rmSync(`./plugins/${plugin_pathname}`, { recursive: true, force: true })
        } catch(err) {
          await e.reply(`插件卸载失败！\n${err.message}`)
          return true
        }
        await e.reply(`插件卸载成功！`)
        return true
    }
    async 安装插件(e){
        if(!e.isMaster) return false
        let commsg = e.msg.match(/^#安装插件(.*)$/)
        let plugin_name = commsg[1]
        if(fs.existsSync(`./plugins/${plugin_name}`)) {
          await e.reply(`[${plugin_name}]该插件已经安装了`)
          return true
        }
        let plugins_list = await this.getplugins()
        let plugin_onoff = []
        for(let item of plugins_list) {
            if(item.pathname == plugin_name) {
                plugin_onoff.push(item)
            }
        }
        if(plugin_onoff.length == 0) {
            await e.reply(`[${plugin_name}]插件不存在！`)
            return true
        }
        await e.reply(`[${plugin_onoff[0].pluginname}]已搜索到插件，正在安装中……`)
        let com
            com = `git clone --depth=1 ${plugin_onoff[0].url}.git ./plugins/${plugin_onoff[0].pathname}/`
        let com_result = await this.execSyncc(com, { encoding: 'buffer' })
        if(com_result.error) {
            await e.reply(`安装时出现错误！\n${com_result.error.message}`)
            return true
        }
        await e.reply(`[${plugin_onoff[0].pluginname}]插件下载完成！正在安装依赖……`)
        com = `cd ./plugins/${plugin_onoff[0].pathname}&& pnpm i --registry=https://registry.npmmirror.com`
        com_result = await this.execSyncc(com, { encoding: 'buffer' })
        if(com_result.error) {
            await e.reply(`[${plugin_onoff[0].pluginname}]安装依赖时出现错误！\n${com_result.stdout}`)
            console.log(com_result)
        }
        await e.reply(`[${plugin_onoff[0].pluginname}]插件安装成功！重启后生效`)
    }
    async 代理安装插件(e){
        if(!e.isMaster) return false
        let commsg = e.msg.match(/^#代理安装插件(.*)$/)
        let plugin_name = commsg[1]
        if(fs.existsSync(`./plugins/${plugin_name}`)) {
          await e.reply(`[${plugin_name}]该插件已经安装了`)
          return true
        }
        let plugins_list = await this.getplugins()
        let plugin_onoff = []
        for(let item of plugins_list) {
            if(item.pathname == plugin_name) {
                plugin_onoff.push(item)
            }
        }
        if(plugin_onoff.length == 0) {
            await e.reply(`[${plugin_name}]插件不存在！`)
            return true
        }
        await e.reply(`[${plugin_onoff[0].pluginname}]已搜索到插件，正在安装中……`)
        let com
            com = `git clone --depth=1 https://github.yunzai.fun/${plugin_onoff[0].url}.git ./plugins/${plugin_onoff[0].pathname}/`
        let com_result = await this.execSyncc(com, { encoding: 'buffer' })
        if(com_result.error) {
            await e.reply(`安装时出现错误！\n${com_result.error.message}`)
            return true
        }
        await e.reply(`[${plugin_onoff[0].pluginname}]插件下载完成！正在安装依赖……`)
        com = `cd ./plugins/${plugin_onoff[0].pathname}&& pnpm i --registry=https://registry.npmmirror.com`
        com_result = await this.execSyncc(com, { encoding: 'buffer' })
        if(com_result.error) {
            await e.reply(`[${plugin_onoff[0].pluginname}]安装依赖时出现错误！\n${com_result.stdout}`)
            console.log(com_result)
        }
        await e.reply(`[${plugin_onoff[0].pluginname}]插件安装成功！重启后生效`)
    }
    async 插件列表(e){
        if(!e.isMaster) return false
        let plugins_list = await this.getplugins()
        let msgList = []
        for(let item of plugins_list) {
            let msg = `插件名称:${item.pluginname}\n作者:${item.author}\n简介:${item.describe}\n插件链接:${item.url}\n安装指令:#安装插件${item.pathname}`
            msgList.push({
                user_id: e.self_id,
                message: msg
            })
        }
        let msg;
        try {
          msg = await e.group.makeForwardMsg(msgList)
        } catch {
          msg = await e.friend.makeForwardMsg(msgList)
        }
        await e.reply(msg)
        return true;
    }
    async execSyncc(cmd) {
      return new Promise((resolve, reject) => {
        exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
          resolve({ error, stdout, stderr });
        });
      });
    }
}

async function lplm(c, l) {
  let a;
  for (let item of c) {
    if(item.pathname == l) {
      a = item
    }
  }
  if(!a) {
    a = {
      author: '@未知',
      describe: '暂无',
      pathname: l,
      pluginname: l,
      url: '未知'
    }
  }
  return a
}
