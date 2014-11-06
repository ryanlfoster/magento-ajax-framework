<?php

/**
 * Class Ecommotion_Ajax_Model_Observer_Abstract
 *
 * @category   Ecommotion
 * @package    Ecommotion_Ajax
 * @author     Ecommotion <developer@ecommotion.com>
 */
abstract class Ecommotion_Ajax_Model_Observer_Abstract
{

    /**
     * @var string
     */
    protected $_controllerName;

    /**
     * @var string
     */
    protected $_moduleName;

    /**
     * @param $controllerName
     * @param $moduleName
     */
    public function __construct($controllerName, $moduleName) {
        $this->_controllerName  = $controllerName;
        $this->_moduleName      = $moduleName;
    }

    /**
     * @return string
     */
    public function getControllerName() {
        return $this->_controllerName;
    }

    /**
     * @return string
     */
    public function getModuleName() {
        return $this->_moduleName;
    }

    /**
     * @return array
     */
    abstract public function getAllowedActions();

    /**
     * @param Mage_Core_Controller_Front_Action $controller
     * @return Mage_Core_Controller_Front_Action
     */
    protected function _forwardToAjax($controller) {
        $controller->getRequest()
            ->initForward()
            ->setControllerName($this->getControllerName())
            ->setModuleName($this->getModuleName())
            ->setActionName($this->getAjaxActionName($controller))
            ->setDispatched(false);

        return $controller;
    }

    /**
     * @param Mage_Core_Controller_Front_Action $controller
     * @return string
     */
    public function isActionAllowed($controller) {
        return in_array($controller->getRequest()->getActionName(), $this->getAllowedActions());
    }

    /**
     * @param Mage_Core_Controller_Front_Action $controller
     * @return string
     */
    public function getAjaxActionName($controller) {
        $action = $controller->getRequest()->getActionName();
        return 'ajax' . ucfirst($action);
    }

    /**
     * @param $controller
     * @return bool
     */
    public function isAjax($controller) {
        return $controller->getRequest()->isAjax();
    }

    /**
     * @param Varien_Event_Observer $observer
     * @return bool
     */
    public function convertActionToAjax($observer) {
        /** @var Mage_Core_Controller_Front_Action $controller */
        $controller = $observer->getEvent()->getControllerAction();

        if($this->isAjax($controller) && $this->isActionAllowed($controller)) {
            $this->_forwardToAjax($controller);
            return false;
        }
    }

}