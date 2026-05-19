import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/colors.dart';
import '../controllers/home_controller.dart';
import '../widgets/category_shimmer.dart';
import '../widgets/home_header.dart';
import '../widgets/food_card.dart';
import '../widgets/food_grid_item.dart';
import '../widgets/section_header.dart';
import 'all_food_screen.dart';
import 'all_categories_screen.dart';
import 'product_details_screen.dart';
import '../widgets/food_card_shimmer.dart';
import '../widgets/checkout_overlay.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isGridView = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<HomeController>().fetchCategories();
      context.read<HomeController>().fetchMenuItems();
    });
  }

  void _navigateToDetails(
    int id,
    String title,
    String image,
    String price,
    String desc,
  ) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProductDetailsScreen(
          id: id,
          title: title,
          image: image,
          price: price,
          description: desc,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Container(
          width: double.infinity,
          height: double.infinity,
          child: Stack(
            children: [
              SingleChildScrollView(
                padding: const EdgeInsets.only(bottom: 100),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 10),
                    const HomeHeader(),
                    const SizedBox(height: 15),

                    // Search Bar
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Container(
                        height: 52,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(25),
                          border: Border.all(
                            color: Colors.grey[200]!,
                            width: 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.search_rounded,
                              color: Colors.grey[600],
                              size: 22,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: TextField(
                                onChanged: (value) {
                                  // Local search or filter can be plugged in here
                                },
                                decoration: InputDecoration(
                                  hintText: "Search Bloom Cafe",
                                  hintStyle: TextStyle(
                                    color: Colors.grey[500],
                                    fontSize: 14,
                                    fontFamily: "Poppins",
                                  ),
                                  border: InputBorder.none,
                                  isDense: true,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Categories Section
                    SectionHeader(
                      title: "Search By Categories",
                      onSeeAll: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const AllCategoriesScreen(),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 12),
                    _buildCategoryList(),

                    // "Only available here" (Recommended Food) Section
                    Consumer<HomeController>(
                      builder: (context, controller, child) {
                        if (controller.selectedCategoryIndex != 0) {
                          return const SizedBox.shrink();
                        }
                        return Column(
                          children: [
                            _buildRecommendedSection(),
                            const SizedBox(height: 25),
                          ],
                        );
                      },
                    ),

                    // Menu List Header Section
                    Consumer<HomeController>(
                      builder: (context, controller, child) {
                        final String categoryName =
                            controller.selectedCategoryIndex == 0
                            ? "Featured"
                            : controller
                                  .categories[controller.selectedCategoryIndex -
                                      1]
                                  .name;
                        return SectionHeader(
                          title: "$categoryName",
                          onSeeAll: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const AllFoodScreen(),
                              ),
                            );
                          },
                          showGridToggle: true,
                          isGrid: _isGridView,
                          onGridToggle: () {
                            setState(() {
                              _isGridView = !_isGridView;
                            });
                          },
                        );
                      },
                    ),
                    const SizedBox(height: 5),

                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Consumer<HomeController>(
                        builder: (context, controller, child) {
                          final String categoryName =
                              controller.selectedCategoryIndex == 0
                              ? "all available items"
                              : controller
                                    .categories[controller
                                            .selectedCategoryIndex -
                                        1]
                                    .name
                                    .toLowerCase();
                          return Text(
                            "List of $categoryName in the store.",
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 12,
                              fontFamily: "Poppins",
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 15),
                    _buildFoodList(),
                  ],
                ),
              ),
              const CheckoutOverlay(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryList() {
    return Consumer<HomeController>(
      builder: (context, controller, child) {
        if (controller.isLoadingCategories) {
          return const CategoryShimmer();
        }

        if (controller.categoryError != null) {
          return Center(child: Text('Error: ${controller.categoryError}'));
        }

        // Add "All" category at the beginning
        final List<Map<String, dynamic>> displayCategories = [
          {'id': -1, 'name': 'All', 'imageUrl': null},
          ...controller.categories.map(
            (c) => {'id': c.id, 'name': c.name, 'imageUrl': c.imageUrl},
          ),
        ];

        return SizedBox(
          height: 100,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: displayCategories.length,
            itemBuilder: (context, index) {
              final category = displayCategories[index];
              final String name = category['name'];
              final String? imageUrl = category['imageUrl'];
              final isSelected = controller.selectedCategoryIndex == index;
              final hasImage = imageUrl != null && imageUrl.isNotEmpty;

              IconData getIconForCategory(String catName) {
                catName = catName.toLowerCase();
                if (catName.contains('pizza')) return Icons.local_pizza_rounded;
                if (catName.contains('burger'))
                  return Icons.lunch_dining_rounded;
                if (catName.contains('drink')) return Icons.local_drink_rounded;
                if (catName.contains('dessert') ||
                    catName.contains('cake') ||
                    catName.contains('cookie'))
                  return Icons.cake_rounded;
                if (catName.contains('pasta') || catName.contains('noodle'))
                  return Icons.dinner_dining_rounded;
                if (catName.contains('salad')) return Icons.egg_alt_rounded;
                if (catName.contains('seafood') || catName.contains('fish'))
                  return Icons.set_meal_rounded;
                if (catName.contains('starter')) return Icons.flatware_rounded;
                return Icons.restaurant_rounded;
              }

              return GestureDetector(
                onTap: () => controller.selectCategory(index),
                child: Container(
                  margin: const EdgeInsets.only(right: 18),
                  child: Column(
                    children: [
                      Container(
                        width: 62,
                        height: 62,
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primaryColor.withOpacity(0.08)
                              : Colors.grey[50],
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.03),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                          border: isSelected
                              ? Border.all(
                                  color: AppColors.primaryColor,
                                  width: 2,
                                )
                              : Border.all(color: Colors.grey[200]!, width: 1),
                        ),
                        child: ClipOval(
                          child: hasImage
                              ? Image.network(
                                  imageUrl,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) =>
                                      Icon(
                                        getIconForCategory(name),
                                        color: isSelected
                                            ? AppColors.primaryColor
                                            : Colors.grey[700],
                                        size: 26,
                                      ),
                                )
                              : Icon(
                                  getIconForCategory(name),
                                  color: isSelected
                                      ? AppColors.primaryColor
                                      : Colors.grey[700],
                                  size: 26,
                                ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        name,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: isSelected
                              ? FontWeight.bold
                              : FontWeight.w500,
                          color: isSelected
                              ? AppColors.primaryColor
                              : Colors.grey[800],
                          fontFamily: "Poppins",
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildRecommendedSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(title: "Only available here", onSeeAll: () {}),
        const SizedBox(height: 15),
        SizedBox(
          height: 235,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            physics: const BouncingScrollPhysics(),
            children: [
              _buildOnlyHereCard(
                title: "Gourmet Cheese Pizza",
                desc: "Extra mozzarella with fresh herbs",
                price: "\$4.99",
                image: "assets/images/pizza_cheese.png",
                time: "15 min",
                rating: "4.8",
                onTap: () => _navigateToDetails(
                  1,
                  "Gourmet Cheese Pizza",
                  "assets/images/pizza_cheese.png",
                  "\$4.99",
                  "Extra mozzarella with fresh herbs and organic tomatoes.",
                ),
              ),
              const SizedBox(width: 15),
              _buildOnlyHereCard(
                title: "BBQ Feast Pizza",
                desc: "Smoky chicken & red onions",
                price: "\$6.50",
                image: "assets/images/pizza_bbq.png",
                time: "20 min",
                rating: "4.9",
                onTap: () => _navigateToDetails(
                  2,
                  "BBQ Feast Pizza",
                  "assets/images/pizza_bbq.png",
                  "\$6.50",
                  "Smoky chicken & red onions with our signature BBQ sauce.",
                ),
              ),
              const SizedBox(width: 15),
              _buildOnlyHereCard(
                title: "Spicy Pepperoni",
                desc: "Beef pepperoni with jalapeños",
                price: "\$5.99",
                image: "assets/images/pizza_pepperoni.png",
                time: "18 min",
                rating: "4.7",
                onTap: () => _navigateToDetails(
                  3,
                  "Spicy Pepperoni",
                  "assets/images/pizza_pepperoni.png",
                  "\$5.99",
                  "Beef pepperoni with spicy jalapeños for an extra kick.",
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildOnlyHereCard({
    required String title,
    required String desc,
    required String price,
    required String image,
    required String time,
    required String rating,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 240,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.asset(
                image,
                width: 240,
                height: 135,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                      fontFamily: "Poppins",
                    ),
                  ),
                ),
                Icon(
                  Icons.favorite_border_rounded,
                  color: Colors.grey[600],
                  size: 20,
                ),
              ],
            ),
            const SizedBox(height: 3),
            Row(
              children: [
                const Icon(Icons.stars_rounded, color: Colors.amber, size: 14),
                const SizedBox(width: 4),
                Text(
                  "Bloom Cafe benefits apply",
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.amber[800],
                    fontWeight: FontWeight.w600,
                    fontFamily: "Poppins",
                  ),
                ),
              ],
            ),
            const SizedBox(height: 3),
            Text(
              "Best Overall • $rating ★ • $time",
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey[600],
                fontFamily: "Poppins",
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFoodList() {
    return Consumer<HomeController>(
      builder: (context, controller, child) {
        if (controller.isLoadingMenuItems) {
          return Column(
            children: List.generate(3, (index) => const FoodCardShimmer()),
          );
        }

        if (controller.menuError != null) {
          return Center(child: Text('Error: ${controller.menuError}'));
        }

        final items = controller.filteredMenuItems;

        if (items.isEmpty) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(20.0),
              child: Text(
                "No items found for this category.",
                style: TextStyle(color: Colors.grey),
              ),
            ),
          );
        }

        const defaultImage = "assets/images/pizza_cheese.png";

        if (_isGridView) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 15,
                mainAxisSpacing: 15,
                childAspectRatio: 0.75,
              ),
              itemCount: items.length,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemBuilder: (context, index) {
                final item = items[index];
                final image =
                    (item.imageUrl != null && item.imageUrl!.isNotEmpty)
                    ? item.imageUrl!
                    : defaultImage;
                return FoodGridItem(
                  id: item.id,
                  title: item.name,
                  desc: item.description ?? "Delicious ${item.name}",
                  image: image,
                  price: item.price,
                  onTap: () => _navigateToDetails(
                    item.id,
                    item.name,
                    image,
                    "\$${item.price.toStringAsFixed(2)}",
                    item.description ?? "Enjoy our delicious ${item.name}.",
                  ),
                );
              },
            ),
          );
        }

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            children: items.map((item) {
              final image = (item.imageUrl != null && item.imageUrl!.isNotEmpty)
                  ? item.imageUrl!
                  : defaultImage;
              return Padding(
                padding: const EdgeInsets.only(bottom: 15),
                child: FoodCard(
                  id: item.id,
                  title: item.name,
                  desc: item.description ?? "Delicious ${item.name}",
                  image: image,
                  price: item.price,
                  onTap: () => _navigateToDetails(
                    item.id,
                    item.name,
                    image,
                    "\$${item.price.toStringAsFixed(2)}",
                    item.description ?? "Enjoy our delicious ${item.name}.",
                  ),
                ),
              );
            }).toList(),
          ),
        );
      },
    );
  }
}
