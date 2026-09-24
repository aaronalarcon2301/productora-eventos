import * as clienteService from '../services/cliente.service.js';

export const getClientes = async (req, res, next) => {
  try {
    const clientes = await clienteService.getAllClientes();
    res.json(clientes);
  } catch (error) {
    next(error);
  }
};

export const getClienteById = async (req, res, next) => {
  try {
    const cliente = await clienteService.getClienteById(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(cliente);
  } catch (error) {
    next(error);
  }
};

export const createCliente = async (req, res, next) => {
  try {
    const cliente = await clienteService.createCliente(req.body);
    res.status(201).json(cliente);
  } catch (error) {
    next(error);
  }
};

export const updateCliente = async (req, res, next) => {
  try {
    const cliente = await clienteService.updateCliente(req.params.id, req.body);
    res.json(cliente);
  } catch (error) {
    next(error);
  }
};

export const deleteCliente = async (req, res, next) => {
  try {
    await clienteService.deleteCliente(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};