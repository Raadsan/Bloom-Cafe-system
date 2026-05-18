import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/colors.dart';
import '../controllers/home_controller.dart';
import '../widgets/category_card.dart';
import '../widgets/category_shimmer.dart';
import '../widgets/home_header.dart';
import '../widgets/food_card.dart';
import '../widgets/food_grid_item.dart';
import '../widgets/recommended_card.dart';
import '../widgets/section_header.dart';
import 'all_food_screen.dart';
import 'product_details_screen.dart';
import '../widgets/bonus_card.dart';
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

  String _getCategoryEmoji(String name) {
    name = name.toLowerCase();
    if (name == 'all') return '🍴';
    if (name.contains('pizza')) return '🍕';
    if (name.contains('burger')) return '🍔';
    if (name.contains('cookie')) return '🍪';
    if (name.contains('drink')) return '🥤';
    if (name.contains('pasta')) return '🍝';
    if (name.contains('salad')) return '🥗';
    if (name.contains('dessert')) return '🍰';
    return '🍽️';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
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
                    const SizedBox(height: 10),
                    const BonusCard(),
                    const SizedBox(height: 25),
                    SectionHeader(
                      title: "Search By Categories",
                      onSeeAll: () {},
                    ),
                    const SizedBox(height: 5),
                    _buildCategoryList(),
                    const SizedBox(height: 25),
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
                    Consumer<HomeController>(
                      builder: (context, controller, child) {
                        final String categoryName =
                            controller.selectedCategoryIndex == 0
                            ? "Food"
                            : controller
                                  .categories[controller.selectedCategoryIndex -
                                      1]
                                  .name;
                        return SectionHeader(
                          title: "$categoryName Menu",
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
          height: 50,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: displayCategories.length,
            itemBuilder: (context, index) {
              final category = displayCategories[index];
              final String name = category['name'];
              final String? imageUrl = category['imageUrl'];
              final emoji = _getCategoryEmoji(name);

              String label = "$emoji $name";

              return Padding(
                padding: const EdgeInsets.only(right: 12),
                child: CategoryCard(
                  label: label,
                  imageUrl: imageUrl,
                  isSelected: controller.selectedCategoryIndex == index,
                  onTap: () => controller.selectCategory(index),
                ),
              );
            },
          ),
        );
      },
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

  Widget _buildRecommendedSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(title: "Recommended Food", onSeeAll: () {}),
        const SizedBox(height: 15),
        SizedBox(
          height: 220,
          child: Stack(
            children: [
              Positioned.fill(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                      colors: [
                        AppColors.primaryColor.withOpacity(0.12),
                        AppColors.primaryColor.withOpacity(0.0),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
              ),
              ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(
                  horizontal: 35,
                  vertical: 10,
                ),
                physics: const BouncingScrollPhysics(),
                children: [
                  RecommendedCard(
                    title: "Gourmet Cheese Pizza",
                    desc: "Extra mozzarella with fresh herbs",
                    price: "₹299",
                    image: "assets/images/pizza_cheese.png",
                    discount: "15% OFF",
                    onTap: () => _navigateToDetails(
                      1, // Mock ID for recommended
                      "Gourmet Cheese Pizza",
                      "assets/images/pizza_cheese.png",
                      "₹299",
                      "Extra mozzarella with fresh herbs and organic tomatoes.",
                    ),
                  ),
                  const SizedBox(width: 20),
                  RecommendedCard(
                    title: "BBQ Feast Pizza",
                    desc: "Smoky chicken & red onions",
                    price: "₹450",
                    image: "assets/images/pizza_bbq.png",
                    discount: "HOT",
                    onTap: () => _navigateToDetails(
                      2, // Mock ID for recommended
                      "BBQ Feast Pizza",
                      "assets/images/pizza_bbq.png",
                      "₹450",
                      "Smoky chicken & red onions with our signature BBQ sauce.",
                    ),
                  ),
                  const SizedBox(width: 20),
                  RecommendedCard(
                    title: "Spicy Pepperoni",
                    desc: "Beef pepperoni with jalapeños",
                    price: "₹399",
                    image: "assets/images/pizza_pepperoni.png",
                    discount: "POPULAR",
                    onTap: () => _navigateToDetails(
                      3, // Mock ID for recommended
                      "Spicy Pepperoni",
                      "assets/images/pizza_pepperoni.png",
                      "₹399",
                      "Beef pepperoni with spicy jalapeños for an extra kick.",
                    ),
                  ),
                  const SizedBox(width: 20),
                  RecommendedCard(
                    title: "Veggie Paradise",
                    desc: "All garden fresh vegetables",
                    price: "₹349",
                    image: "assets/images/pizza_cheese.png",
                    discount: "VEG",
                    onTap: () => _navigateToDetails(
                      4, // Mock ID for recommended
                      "Veggie Paradise",
                      "assets/images/pizza_cheese.png",
                      "₹349",
                      "All garden fresh vegetables with low-fat mozzarella.",
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
