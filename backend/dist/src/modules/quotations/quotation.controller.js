import { sendSuccess } from '../../utils/api-response.js';
import { quotationService } from './quotation.service.js';
export const createQuotation = async (req, res) => {
    const quotation = await quotationService.create(req.body, req.user);
    sendSuccess(res, 201, 'Quotation created successfully', quotation);
};
export const listQuotations = async (req, res) => {
    const { items, pagination } = await quotationService.list(req.query, req.user);
    sendSuccess(res, 200, 'Quotations fetched successfully', items, pagination);
};
export const getQuotation = async (req, res) => {
    const quotation = await quotationService.getById(req.params.id, req.user);
    sendSuccess(res, 200, 'Quotation fetched successfully', quotation);
};
export const updateQuotation = async (req, res) => {
    const quotation = await quotationService.update(req.params.id, req.body, req.user);
    sendSuccess(res, 200, 'Quotation updated successfully', quotation);
};
export const deleteQuotation = async (req, res) => {
    await quotationService.remove(req.params.id, req.user);
    res.status(204).send();
};
export const addLineItem = async (req, res) => {
    const quotation = await quotationService.addLineItem(req.params.id, req.body, req.user);
    sendSuccess(res, 201, 'Line item added successfully', quotation);
};
export const updateLineItem = async (req, res) => {
    const quotation = await quotationService.updateLineItem(req.params.id, req.params.itemId, req.body, req.user);
    sendSuccess(res, 200, 'Line item updated successfully', quotation);
};
export const removeLineItem = async (req, res) => {
    const quotation = await quotationService.removeLineItem(req.params.id, req.params.itemId, req.user);
    sendSuccess(res, 200, 'Line item removed successfully', quotation);
};
export const calculateRisk = async (req, res) => {
    const quotation = await quotationService.calculateRisk(req.params.id, req.user);
    sendSuccess(res, 200, 'Risk score calculated successfully', quotation);
};
