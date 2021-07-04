/*
 * 入口文件
 */

import { Node, warn, Widget } from "cc";
import { UICallbacks } from "./Defines";
import { DelegateComponent } from "./DelegateComponent";
import { LayerDialog } from "./LayerDialog";
import { LayerNotify } from "./LayerNotify";
import { LayerPopUp } from "./LayerPopup";
import { LayerUI } from "./LayerUI";
import { UIMap } from "./UIMap";

export enum LayerType {
    UI = "LayerUI",
    PopUp = "LayerPopUp",
    Dialog = "LayerDialog",
    Alert = "LayerAlert"
}

/** UI配置结构体 */
export interface UIConfig {
    bundle?: string;
    layer: LayerType;
    prefab: string;
}

export class LayerManager {
    /** 游戏界面特效层 */
    public game!: Node;
    /** 界面地图 */
    public uiMap!: UIMap;

    /** 界面层 */
    private ui!: LayerUI;
    /** 弹窗层 */
    private popup!: LayerPopUp;
    /** 只能弹出一个的弹窗 */
    private dialog!: LayerDialog;
    /** 游戏系统提示弹窗（优先显示） */
    private alert!: LayerDialog;
    /** 消息提示控制器，请使用show方法来显示 */
    private notify!: LayerNotify;
    /** UI配置 */
    private configs: { [key: number]: UIConfig } = {};

    /**
     * 初始化所有UI的配置对象
     * @param configs 配置对象
     */
    public init(configs: { [key: number]: UIConfig }): void {
        this.configs = configs;
    }

    /**
     * 显示toast
     * @param content 文本表示
     * @param useI18n 是否使用多语言
     */
    public toast(content: string, useI18n: boolean = false) {
        this.notify.show(content, useI18n)
    }

    /**
     * 设置界面配置
     * @param uiId   要设置的界面id
     * @param config 要设置的配置
     */
    public setConfig(uiId: number, config: UIConfig): void {
        this.configs[uiId] = config;
    }

    /** 设置界面地图配置 */
    public setUIMap(data: any) {
        if (this.uiMap == null) {
            this.uiMap = new UIMap();
        }
        this.uiMap.init(this, data);
    }

    public open(uiId: number, uiArgs: any = null, callbacks?: UICallbacks): void {
        var config = this.configs[uiId];
        if (config == null) {
            warn(`打开编号为【${uiId}】的界面失败，配置信息不存在`);
            return;
        }

        switch (config.layer) {
            case LayerType.UI:
                this.ui.add(config.prefab, uiArgs, callbacks);
                break;
            case LayerType.PopUp:
                this.popup.add(config.prefab, uiArgs, callbacks);
                break;
            case LayerType.Dialog:
                this.dialog.add(config.prefab, uiArgs, callbacks);
                break;
            case LayerType.Alert:
                this.alert.add(config.prefab, uiArgs, callbacks);
                break;
        }
    }

    public has(uiId: number) {
        var config = this.configs[uiId];
        if (config == null) {
            warn(`编号为【${uiId}】的界面失败，配置信息不存在`);
            return;
        }

        var result = false;
        switch (config.layer) {
            case LayerType.UI:
                result = this.ui.has(config.prefab);
                break;
            case LayerType.PopUp:
                result = this.popup.has(config.prefab);
                break;
            case LayerType.Dialog:
                result = this.dialog.has(config.prefab);
                break;
            case LayerType.Alert:
                result = this.alert.has(config.prefab);
                break;
        }
        return result;
    }

    public remove(uiId: number, isDestroy = true) {
        var config = this.configs[uiId];
        if (config == null) {
            warn(`删除编号为【${uiId}】的界面失败，配置信息不存在`);
            return;
        }

        switch (config.layer) {
            case LayerType.UI:
                this.ui.remove(config.prefab, isDestroy);
                break;
            case LayerType.PopUp:
                this.popup.remove(config.prefab, isDestroy);
                break;
            case LayerType.Dialog:
                this.dialog.remove(config.prefab, isDestroy);
                break;
            case LayerType.Alert:
                this.alert.remove(config.prefab, isDestroy);
                break;
        }
    }

    /** 删除一个通过this框架添加进来的节点 */
    public removeByNode(node: Node, isDestroy: boolean = false) {
        if (node instanceof Node) {
            let comp = node.getComponent(DelegateComponent);
            if (comp && comp.viewParams) {
                (node.parent as LayerUI).removeByUuid(comp.viewParams.uuid, isDestroy);
            }
            else {
                warn(`当前删除的node不是通过界面管理器添加到舞台上`);
                node.destroy();
            }
            return;
        }
    }

    public clear(isDestroy: boolean = false) {
        this.ui.clear(isDestroy);
        this.popup.clear(isDestroy);
        this.dialog.clear(isDestroy);
        this.alert.clear(isDestroy);
    }

    public constructor(root: Node) {
        this.game = new Node("LayerGame");
        var widget: Widget = this.game.addComponent(Widget);
        widget.isAlignLeft = widget.isAlignRight = widget.isAlignTop = widget.isAlignBottom = true;
        widget.left = widget.right = widget.top = widget.bottom = 0;
        widget.alignMode = 2;
        widget.enabled = true;

        this.ui = new LayerUI(LayerType.UI);
        this.popup = new LayerPopUp(LayerType.PopUp);
        this.dialog = new LayerDialog(LayerType.Dialog);
        this.alert = new LayerDialog(LayerType.Alert);
        this.notify = new LayerNotify("LayerNotify");

        root.addChild(this.game);
        root.addChild(this.ui);
        root.addChild(this.popup);
        root.addChild(this.dialog);
        root.addChild(this.alert);
        root.addChild(this.notify);
    }
}