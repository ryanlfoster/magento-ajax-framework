<?php

/**
 * Class Ecommotion_Ajax_Controller_Abstract
 *
 * @category   Ecommotion
 * @package    Ecommotion_Ajax
 * @author     Ecommotion <developer@ecommotion.com>
 */
abstract class Ecommotion_Ajax_Controller_Abstract extends Mage_Core_Controller_Front_Action
{
    const AJAX_STATUS_SUCCESS = 'success';
    const AJAX_STATUS_FAILURE = 'failure';

    protected function _returnResult($status, $data = array()) {

        $data['status'] = $status;

        $this->getResponse()->setHeader('Content-Type', 'application/json');
        return $this->getResponse()->setBody(Mage::helper('core')->jsonEncode($data));
    }

    protected function _initAjaxLayout() {
        $this->getLayout()->getUpdate()
            ->addHandle('ajax_response');

        $this->addActionLayoutHandles();
    }

    protected function _getBlocks() {

        $this->loadLayoutUpdates();
        $this->generateLayoutXml()->generateLayoutBlocks();
        $this->_initLayoutMessages('checkout/session');
        $this->_initLayoutMessages('catalog/session');

        $layout = $this->getLayout();

        $blocks = array();

        try {
            $response = $layout->getBlock('ajax.response.blocks');

            if($response) {
                /** @var Mage_Core_Block_Template $block */
                foreach($response->getSortedChildBlocks() as $block) {
                    $alias = $block->getNameInLayout();
                    if($alias == '') continue;
                    $blocks[$alias] = $block->toHtml();;
                }
            }

        } catch(Exception $e) {
            Mage::logException($e);
        }

        return $blocks;

    }

    public function returnSuccess($data = array()) {
        if($blocks = $this->_getBlocks()) {
            $data['blocks'] = $blocks;
        }
        return $this->_returnResult(self::AJAX_STATUS_SUCCESS, $data);
    }

    public function returnFailure($message = '') {
        $data = array();
        if($blocks = $this->_getBlocks()) {
            $data['blocks'] = $blocks;
        }
        $data['message'] = $message;
        return $this->_returnResult(self::AJAX_STATUS_FAILURE, $data);
    }

}