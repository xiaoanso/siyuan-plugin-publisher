# Copyright (c) 2026. Fork deploy helper.
# 将 dist/ 整目录复制到思源插件目录（实体文件，不用软链）。
# 与 make_dev_link.py 互斥：若目标已是软链会先拆除再复制。
import argparse
import json
import os
import shutil
import sys
import tempfile

import scriptutils

# ************************************ 在这里填写你的配置 ************************************
# 思源工作空间下的 data/plugins 目录
targetDir = "/Users/jackin/Documents/siyuan/data/plugins"
# 构建输出目录，相对于项目根路径
devOutDir = "dist"
# ******************************************************************************************


def _log(info):
    print(f"\033[36m{info}\033[0m")


def _error(info):
    print(f"\033[31m{info}\033[0m")


def get_plugin_name(plugin_type="plugin"):
    path = f"./{plugin_type}.json"
    if not os.path.exists(path):
        _error(f"失败！找不到 {plugin_type}.json")
        sys.exit(1)
    with open(path, "r", encoding="utf-8-sig") as file:
        plugin = json.load(file)
    name = plugin.get("name")
    if not name:
        _error(f"失败！请在 {plugin_type}.json 中设置插件名称")
        sys.exit(1)
    return name


def deploy_copy(target_dir, plugin_name, src_dir):
    if not os.path.isdir(src_dir):
        _error(f'失败！源目录不存在: "{src_dir}"')
        _error("请先执行 pnpm build 或 pnpm dev 生成 dist/")
        sys.exit(1)

    plugin_json = os.path.join(src_dir, "plugin.json")
    if not os.path.isfile(plugin_json):
        _error(f'失败！源目录缺少 plugin.json: "{src_dir}"')
        sys.exit(1)

    if not os.path.isdir(target_dir):
        _error(f'失败！插件目录不存在: "{target_dir}"')
        _error("请在 scripts/deploy_copy.py 中设置 targetDir")
        sys.exit(1)

    dest = os.path.join(target_dir, plugin_name) if plugin_name.strip() else target_dir

    # 先拷到同级临时目录，再原子替换，避免复制中途思源读到半成品
    parent = os.path.dirname(os.path.abspath(dest))
    staging = tempfile.mkdtemp(prefix=f".{plugin_name}.staging-", dir=parent)
    try:
        # copytree 要求目标不存在
        staging_plugin = os.path.join(staging, "plugin")
        shutil.copytree(src_dir, staging_plugin)

        if os.path.islink(dest):
            os.unlink(dest)
            _log(f"已拆除旧软链: {dest}")
        elif os.path.isdir(dest):
            shutil.rmtree(dest)
            _log(f"已清空旧目录: {dest}")
        elif os.path.exists(dest):
            os.remove(dest)

        os.rename(staging_plugin, dest)
        _log(f"Done! 已复制到 {dest}")
    finally:
        if os.path.isdir(staging):
            shutil.rmtree(staging, ignore_errors=True)


if __name__ == "__main__":
    scriptutils.switch_workdir()

    parser = argparse.ArgumentParser(description="Copy dist/ into SiYuan plugins directory (no symlink).")
    parser.add_argument("-f", "--forder", required=False, help="target plugins directory")
    parser.add_argument("-d", "--dist", required=False, default="dist", help="build output directory")
    parser.add_argument("-t", "--type", default="plugin", help="plugin | widget")
    args = parser.parse_args()

    devOutDir = args.dist
    if args.forder:
        targetDir = args.forder
        name = ""
    else:
        name = get_plugin_name(args.type)
        _log(f">>> 插件名称: {name}")

    src = os.path.join(os.getcwd(), devOutDir)
    _log(f'>>> 源目录: {src}')
    _log(f'>>> 目标插件根: {targetDir}')
    deploy_copy(targetDir, name, src)
