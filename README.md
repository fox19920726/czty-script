#0.5.7
date@2020-05-25
name@金角大王
change:
1、支持别名扩展
2、图片资源、字体资源在localhost下不hash
3、去除topo文件夹拷贝功能

#0.5.9
date@2020-05-26
name@金角大王
change:
1、把uglifyjs-webpack-plugin插件换成terser-webpack-plugin插件

#0.6.0
date@2020-05-26
name@金角大王
change:
1、固定vue-template-compiler版本号


#0.6.1
date@2020-06-05
name@金角大王
change:
1、可变vue-template-compiler版本号，因为还是需要升级


#0.6.2
date@2020-09-02
name@金角大王
change:
1、兼容了react为技术栈的项目
2、原先的vue项目可以不升级版本


#0.6.3
date@2020-09-04
name@金角大王
change:
1、react项目添加eslint



#0.6.4
date@2021-01-26
name@金角大王
change:
1、更新eslint版本
2、把eslint-loader换成eslint-webpack-plugin
3、新增对ts的支持

#0.6.5
date@2021-01-29
name@金角大王
change:
1、后缀名添加.d.ts格式的

#0.6.6
date@2021-03-26
name@金角大王
change:
1、新增暴露是否是ts编写的入口
2、devtool只在开发阶段打开（eval-cheap-source-map），其他情况都关闭（如果打开cheap-source-map,react代码压缩后显示空白页面）


#0.6.7
date@2021-04-21
name@金角大王
change:
1、npm包版本固定


#0.6.8
date@2021-04-21
name@金角大王
change:
1、devtool区分react/vue

#0.6.9
date@2021-04-21
name@金角大王
change:
1、npm包版本问题


#0.7.0
date@2021-04-21
name@金角大王
change:
1、webpack包版本^


#0.7.1
date@2021-04-22
name@金角大王
change:
1、还是搞安装依赖包版本的问题


#0.7.2
date@2021-06-01
name@金角大王
change:
1、修改iconfont.css在过大之后产生独立文件后，导致字体文件引入的路径不对的问题，添加了个publicPath


#0.7.3
date@2021-06-01
name@金角大王
change:
1、支持多页面配置


#0.7.4
date@2021-06-03
name@金角大王
change:
1、支持gzip（需要nginx开启gzip）

