import 'package:flutter/material.dart';
import '../../data/datasources/home_remote_datasource.dart';
import '../../data/models/category_model.dart';
import '../../data/models/menu_item_model.dart';

class HomeController extends ChangeNotifier {
  final HomeRemoteDataSource _dataSource = HomeRemoteDataSource();

  List<CategoryModel> _categories = [];
  List<MenuItemModel> _menuItems = []; 
  bool _isLoadingCategories = false;
  bool _isLoadingMenuItems = false;
  String? _categoryError;
  String? _menuError;
  int _selectedCategoryIndex = 0;

  List<CategoryModel> get categories => _categories;
  List<MenuItemModel> get menuItems => _menuItems;
  bool get isLoadingCategories => _isLoadingCategories;
  bool get isLoadingMenuItems => _isLoadingMenuItems;
  String? get categoryError => _categoryError;
  String? get menuError => _menuError;
  int get selectedCategoryIndex => _selectedCategoryIndex;

  List<MenuItemModel> get filteredMenuItems {
    return _menuItems;
  }

  void selectCategory(int index) {
    _selectedCategoryIndex = index;
    notifyListeners();
    
    // Fetch items from the correct endpoint based on selection
    if (index == 0) {
      fetchMenuItems();
    } else {
      final selectedCategoryId = _categories[index - 1].id;
      fetchMenuItems(categoryId: selectedCategoryId);
    }
  }

  Future<void> fetchCategories() async {
    _isLoadingCategories = true;
    _categoryError = null;
    notifyListeners();

    try {
      _categories = await _dataSource.getCategories();
    } catch (e) {
      _categoryError = e.toString();
    } finally {
      _isLoadingCategories = false;
      notifyListeners();
    }
  }

  Future<void> fetchMenuItems({int? categoryId}) async {
    _isLoadingMenuItems = true;
    _menuError = null;
    notifyListeners();

    try {
      final data = categoryId == null 
          ? await _dataSource.getMenuItems()
          : await _dataSource.getMenuItemsByCategory(categoryId);
      _menuItems = data.map((json) => MenuItemModel.fromJson(json)).toList();
    } catch (e) {
      _menuError = e.toString();
    } finally {
      _isLoadingMenuItems = false;
      notifyListeners();
    }
  }
}
