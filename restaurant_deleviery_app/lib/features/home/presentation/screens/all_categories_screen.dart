import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:iconly/iconly.dart';
import 'package:restaurant_delivery_app/core/theme/colors.dart';
import '../controllers/home_controller.dart';
import '../widgets/checkout_overlay.dart';

class AllCategoriesScreen extends StatefulWidget {
  const AllCategoriesScreen({super.key});

  @override
  State<AllCategoriesScreen> createState() => _AllCategoriesScreenState();
}

class _AllCategoriesScreenState extends State<AllCategoriesScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = "";

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Color> _getRandomGradient(int index) {
    final List<List<Color>> gradients = [
      [const Color(0xFFE85D04), const Color(0xFFF48C06)],
      [const Color(0xFF1A759F), const Color(0xFF1E6091)],
      [const Color(0xFF38B000), const Color(0xFF70E000)],
      [const Color(0xFF7209B7), const Color(0xFFB5179E)],
      [const Color(0xFFD90429), const Color(0xFFEF233C)],
      [const Color(0xFFF77F00), const Color(0xFFFCBF49)],
      [const Color(0xFF0077B6), const Color(0xFF0096C7)],
      [const Color(0xFF6B705C), const Color(0xFFA5A58D)],
    ];
    return gradients[index % gradients.length];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgColor,
      appBar: AppBar(
        title: const Text(
          'Menu Categories',
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.w600,
            fontSize: 20,
            fontFamily: "Poppins",
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(IconlyLight.arrow_left, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Stack(
        children: [
          Consumer<HomeController>(
            builder: (context, controller, child) {
              final categories = controller.categories;

              if (controller.isLoadingCategories) {
                return const Center(
                  child: CircularProgressIndicator(
                    color: AppColors.primaryColor,
                  ),
                );
              }

              if (controller.categoryError != null) {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Text(
                      'Error: ${controller.categoryError}',
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),
                );
              }

              // Filter categories by search query
              final filteredCategories = categories.where((c) {
                return c.name.toLowerCase().contains(
                  _searchQuery.toLowerCase(),
                );
              }).toList();

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Search Bar Area
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 15),
                    color: Colors.white,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "Explore Our Tasty Catalog",
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey,
                            fontFamily: "Poppins",
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: Colors.grey[200]!,
                              width: 1,
                            ),
                          ),
                          child: TextField(
                            controller: _searchController,
                            onChanged: (val) {
                              setState(() {
                                _searchQuery = val;
                              });
                            },
                            decoration: InputDecoration(
                              hintText: "Search categories...",
                              hintStyle: TextStyle(
                                color: Colors.grey[400],
                                fontSize: 14,
                                fontFamily: "Poppins",
                              ),
                              prefixIcon: Icon(
                                IconlyLight.search,
                                color: Colors.grey[400],
                                size: 20,
                              ),
                              suffixIcon: _searchQuery.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(
                                        Icons.clear,
                                        color: Colors.grey,
                                        size: 18,
                                      ),
                                      onPressed: () {
                                        _searchController.clear();
                                        setState(() {
                                          _searchQuery = "";
                                        });
                                      },
                                    )
                                  : null,
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(
                                vertical: 14,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Categories Grid View
                  Expanded(
                    child: filteredCategories.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  IconlyLight.search,
                                  size: 60,
                                  color: Colors.grey[300],
                                ),
                                const SizedBox(height: 16),
                                const Text(
                                  "No categories found",
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.grey,
                                    fontWeight: FontWeight.w500,
                                    fontFamily: "Poppins",
                                  ),
                                ),
                              ],
                            ),
                          )
                        : GridView.builder(
                            padding: const EdgeInsets.all(20),
                            physics: const BouncingScrollPhysics(),
                            gridDelegate:
                                const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 2,
                                  crossAxisSpacing: 15,
                                  mainAxisSpacing: 15,
                                  childAspectRatio: 0.95,
                                ),
                            itemCount:
                                filteredCategories.length +
                                1, // +1 for "All Categories" card
                            itemBuilder: (context, index) {
                              // Card 0: "All Categories" shortcut
                              if (index == 0) {
                                return _buildCategoryCard(
                                  title: "All Foods",
                                  imageUrl: null,
                                  gradient: [
                                    AppColors.primaryColor,
                                    AppColors.primaryColor.withOpacity(0.8),
                                  ],
                                  onTap: () {
                                    controller.selectCategory(0);
                                    Navigator.pop(context);
                                  },
                                );
                              }

                              final cat = filteredCategories[index - 1];
                              final gradient = _getRandomGradient(cat.id);

                              // Find selected index in original list to notify HomeController correctly
                              final int originalIndex = categories.indexWhere(
                                (c) => c.id == cat.id,
                              );

                              return _buildCategoryCard(
                                title: cat.name,
                                imageUrl: cat.imageUrl,
                                gradient: gradient,
                                onTap: () {
                                  if (originalIndex != -1) {
                                    controller.selectCategory(
                                      originalIndex + 1,
                                    );
                                  }
                                  Navigator.pop(context);
                                },
                              );
                            },
                          ),
                  ),
                ],
              );
            },
          ),
          const CheckoutOverlay(),
        ],
      ),
    );
  }

  Widget _buildCategoryCard({
    required String title,
    required String? imageUrl,
    required List<Color> gradient,
    required VoidCallback onTap,
  }) {
    final bool hasImage = imageUrl != null && imageUrl.isNotEmpty;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: Stack(
            children: [
              // Background (Image or Gradient)
              Positioned.fill(
                child: hasImage
                    ? Image.network(
                        imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: gradient,
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                          ),
                        ),
                      )
                    : Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: gradient,
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                        ),
                      ),
              ),

              // Glassmorphic / Dark Overlay to make text legible
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.black.withOpacity(hasImage ? 0.35 : 0.15),
                        Colors.black.withOpacity(hasImage ? 0.65 : 0.45),
                      ],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                ),
              ),

              // Decorative Top Ring
              Positioned(
                top: -30,
                right: -30,
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.08),
                  ),
                ),
              ),

              // Card Content
              Positioned.fill(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Circular Category Image/Icon
                      Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white.withOpacity(0.3),
                            width: 1.5,
                          ),
                        ),
                        child: ClipOval(
                          child: hasImage
                              ? Image.network(
                                  imageUrl,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) =>
                                      const Icon(
                                        Icons.restaurant_menu,
                                        color: Colors.white,
                                        size: 20,
                                      ),
                                )
                              : const Icon(
                                  Icons.restaurant_menu,
                                  color: Colors.white,
                                  size: 20,
                                ),
                        ),
                      ),

                      // Text info
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              fontFamily: "Poppins",
                              letterSpacing: 0.3,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Text(
                                "View items",
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.white.withOpacity(0.85),
                                  fontFamily: "Poppins",
                                  fontWeight: FontWeight.w400,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Icon(
                                IconlyLight.arrow_right,
                                size: 10,
                                color: Colors.white.withOpacity(0.85),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
