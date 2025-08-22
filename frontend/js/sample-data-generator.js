/**
 * Sample Data Generator for Apostolic Church International
 * Generates realistic sample content for blogs, events, and sermons
 */

const SampleDataGenerator = {
    /**
     * Generate sample blog posts
     */
    generateSampleBlogs: function() {
        const currentDate = new Date();
        
        return [
            {
                id: 'blog_' + Date.now() + '_1',
                title: 'Welcome to Our Church Family',
                summary: 'Join us as we explore what it means to be part of the Apostolic Church International community and discover the love of Christ together.',
                content: `
                    <h2>A Warm Welcome</h2>
                    <p>Welcome to the Apostolic Church International! We are thrilled that you have chosen to visit our website and learn more about our church family. Our doors are always open to anyone seeking to grow in their relationship with God and connect with fellow believers.</p>
                    
                    <h3>Our Mission</h3>
                    <p>At Apostolic Church International, we are committed to spreading the Gospel of Jesus Christ and building a community where everyone can experience God's love, grace, and transformative power. We believe in the importance of fellowship, worship, and service to others.</p>
                    
                    <h3>What to Expect</h3>
                    <p>When you visit us, you can expect:</p>
                    <ul>
                        <li>Warm and welcoming atmosphere</li>
                        <li>Spirit-filled worship and praise</li>
                        <li>Biblical teaching and preaching</li>
                        <li>Opportunities for fellowship and connection</li>
                        <li>Programs for all ages</li>
                    </ul>
                    
                    <p>We look forward to meeting you and walking alongside you in your spiritual journey. Come as you are – you belong here!</p>
                `,
                imageUrl: 'images/welcome.jpg',
                status: 'published',
                createdAt: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'blog_' + Date.now() + '_2',
                title: 'The Power of Prayer in Daily Life',
                summary: 'Discover how prayer can transform your daily experience and strengthen your relationship with God through practical insights and biblical wisdom.',
                content: `
                    <h2>Prayer: Our Direct Line to God</h2>
                    <p>Prayer is one of the most powerful tools God has given us. It's our direct line of communication with our Heavenly Father, available to us 24/7. Yet many believers struggle to maintain a consistent prayer life or wonder if their prayers are truly making a difference.</p>
                    
                    <h3>Why Prayer Matters</h3>
                    <p>Prayer is not just about asking God for things – though petition is certainly part of it. Prayer is about:</p>
                    <ul>
                        <li><strong>Relationship:</strong> Building intimacy with God</li>
                        <li><strong>Transformation:</strong> Allowing God to change our hearts</li>
                        <li><strong>Alignment:</strong> Bringing our will in line with God's will</li>
                        <li><strong>Peace:</strong> Finding rest and comfort in God's presence</li>
                    </ul>
                    
                    <h3>Practical Prayer Tips</h3>
                    <p>Here are some practical ways to enhance your prayer life:</p>
                    <ol>
                        <li>Set aside a specific time each day for prayer</li>
                        <li>Find a quiet place where you can focus</li>
                        <li>Use the ACTS model: Adoration, Confession, Thanksgiving, Supplication</li>
                        <li>Keep a prayer journal to track God's faithfulness</li>
                        <li>Pray with others – there's power in corporate prayer</li>
                    </ol>
                    
                    <p>Remember, God hears every prayer and cares about every detail of your life. Don't give up – keep praying!</p>
                `,
                imageUrl: 'images/p1.jpg',
                status: 'published',
                createdAt: new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    },

    /**
     * Generate sample events
     */
    generateSampleEvents: function() {
        const currentDate = new Date();
        
        return [
            {
                id: 'event_' + Date.now() + '_1',
                title: 'Sunday Worship Service',
                date: new Date(currentDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
                location: 'Main Sanctuary, Apostolic Church International',
                description: `
                    <h3>Join Us for Sunday Worship</h3>
                    <p>Come and experience the presence of God in our weekly Sunday worship service. We gather together as a church family to praise, worship, and hear from God's Word.</p>
                    
                    <h4>Service Schedule:</h4>
                    <ul>
                        <li><strong>10:00 AM:</strong> Worship and Praise</li>
                        <li><strong>10:30 AM:</strong> Word of God</li>
                        <li><strong>11:30 AM:</strong> Prayer and Ministry</li>
                        <li><strong>12:00 PM:</strong> Fellowship</li>
                    </ul>
                    
                    <p>All are welcome! Come as you are and experience God's love and grace.</p>
                `,
                imageUrl: 'images/g1.jpeg',
                status: 'published',
                createdAt: new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'event_' + Date.now() + '_2',
                title: 'Youth Fellowship Night',
                date: new Date(currentDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
                location: 'Youth Center, Apostolic Church International',
                description: `
                    <h3>Youth Fellowship Night</h3>
                    <p>Calling all young people ages 13-25! Join us for an evening of fellowship, games, worship, and biblical teaching designed specifically for our youth.</p>
                    
                    <h4>What to Expect:</h4>
                    <ul>
                        <li>Interactive games and activities</li>
                        <li>Contemporary worship music</li>
                        <li>Relevant biblical teaching</li>
                        <li>Small group discussions</li>
                        <li>Pizza and refreshments</li>
                    </ul>
                    
                    <p>Bring a friend and come ready to have fun while growing in your faith!</p>
                `,
                imageUrl: 'images/g2.jpeg',
                status: 'published',
                createdAt: new Date(currentDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(currentDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    },

    /**
     * Generate sample sermons
     */
    generateSampleSermons: function() {
        // DISABLED: Return empty array to prevent automatic sermon generation
        console.log('📝 Sample sermon generation is disabled to prevent unwanted content creation');
        return [];
    },

    /**
     * Seed all sample data to localStorage
     */
    seedAllSampleData: function() {
        try {
            // Generate sample data
            const sampleBlogs = this.generateSampleBlogs();
            const sampleEvents = this.generateSampleEvents();
            const sampleSermons = this.generateSampleSermons();
            
            // Save to localStorage
            localStorage.setItem('blogs', JSON.stringify(sampleBlogs));
            localStorage.setItem('events', JSON.stringify(sampleEvents));
            localStorage.setItem('sermons', JSON.stringify(sampleSermons));
            
            // Trigger sync events for real-time updates
            const syncData = {
                contentType: 'all',
                action: 'seed',
                timestamp: Date.now()
            };
            
            localStorage.setItem('lastSync', JSON.stringify(syncData));
            window.dispatchEvent(new CustomEvent('contentSync', { detail: syncData }));
            
            console.log('✅ Sample data seeded successfully!');
            console.log(`- ${sampleBlogs.length} blog posts created`);
            console.log(`- ${sampleEvents.length} events created`);
            console.log(`- ${sampleSermons.length} sermons created`);
            
            return {
                success: true,
                blogs: sampleBlogs.length,
                events: sampleEvents.length,
                sermons: sampleSermons.length
            };
        } catch (error) {
            console.error('❌ Error seeding sample data:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Clear all data and reseed with fresh sample data
     */
    resetWithSampleData: function() {
        try {
            // Clear existing data
            localStorage.removeItem('blogs');
            localStorage.removeItem('events');
            localStorage.removeItem('sermons');
            localStorage.removeItem('lastSync');
            
            console.log('🗑️ Cleared existing data');
            
            // Seed fresh sample data
            return this.seedAllSampleData();
        } catch (error) {
            console.error('❌ Error resetting data:', error);
            return { success: false, error: error.message };
        }
    }
};

// Make the generator available globally for testing
window.SampleDataGenerator = SampleDataGenerator;

console.log('📝 Sample Data Generator loaded. Use SampleDataGenerator.seedAllSampleData() to create sample content.');
